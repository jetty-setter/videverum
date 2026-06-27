"""
Vide Verum — Admin API
FastAPI backend for the admin interface.
Deploy on Lambda/ECR same pattern as QuicLens.

Routes:
  POST /incidents          — create incident
  GET  /incidents          — list (paginated, filterable by status/era/tier)
  GET  /incidents/{id}     — get single incident
  PUT  /incidents/{id}     — update incident
  POST /incidents/{id}/publish  — set status to published
  POST /ai/draft           — draft entry with Claude API
  GET  /stats              — dashboard stats
"""

import os, json, hashlib, re
from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel
import boto3
from boto3.dynamodb.conditions import Key, Attr
import httpx

app = FastAPI(title="Vide Verum Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock down to your CloudFront domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DynamoDB ────────────────────────────────────────────────────────────────
TABLE_NAME = os.getenv("DYNAMO_TABLE", "vv-incidents")
AWS_REGION  = os.getenv("AWS_REGION", "us-east-1")
dynamo      = boto3.resource("dynamodb", region_name=AWS_REGION)
table       = dynamo.Table(TABLE_NAME)

# ── Anthropic API ────────────────────────────────────────────────────────────
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"


# ── Models ────────────────────────────────────────────────────────────────────
class Source(BaseModel):
    type: str
    title: str
    url: str
    verified: bool = False

class IncidentCreate(BaseModel):
    title: str
    hook: str = ""
    date_display: str = ""
    date_sort: str = ""
    date_precision: str = "exact"
    location_name: str = ""
    country: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    era: str = ""
    source_type: str = "military"
    narrative: str = ""
    curator_notes: str = ""
    credibility_score: int = 3
    tier: str = "pending"
    status: str = "pending"
    criteria_met: list = []
    themes: list = []
    physical_evidence: bool = False
    cover_up_indicators: bool = False
    sources: list[Source] = []
    related_incidents: list = []
    ai_drafted: bool = False
    verify_flags: list = []

class IncidentUpdate(IncidentCreate):
    pass

class AIDraftRequest(BaseModel):
    case_name: str


# ── Utilities ──────────────────────────────────────────────────────────────
def make_id(seed: str) -> str:
    return "VV-" + hashlib.sha256(seed.encode()).hexdigest()[:12].upper()

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def incident_to_item(incident_id: str, data: dict) -> dict:
    item = {**data, "incident_id": incident_id, "updated_at": now_iso()}
    # Ensure lat/lng are stored as Decimal-compatible strings for DynamoDB
    for k in ("lat", "lng"):
        if item.get(k) is not None:
            item[k] = str(item[k])
    # Convert source objects to dicts
    if "sources" in item:
        item["sources"] = [
            s.dict() if hasattr(s, "dict") else s
            for s in item["sources"]
        ]
    return item


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "vide-verum-admin"}


@app.get("/stats")
def get_stats():
    try:
        # Scan is fine for a small editorial database (<10k items)
        resp = table.scan(
            ProjectionExpression="incident_id, #s, tier",
            ExpressionAttributeNames={"#s": "status"}
        )
        items = resp.get("Items", [])
        total      = len(items)
        featured   = sum(1 for i in items if i.get("tier") == "featured")
        verified   = sum(1 for i in items if i.get("tier") == "verified")
        pending    = sum(1 for i in items if i.get("status") == "pending")
        published  = sum(1 for i in items if i.get("status") == "published")
        return {
            "total": total,
            "featured": featured,
            "verified": verified,
            "pending": pending,
            "published": published,
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/incidents", status_code=201)
def create_incident(data: IncidentCreate):
    incident_id = make_id(f"{data.title}-{now_iso()}")
    item = incident_to_item(incident_id, {
        **data.dict(),
        "created_at": now_iso(),
        "status": data.status or "pending",
    })
    try:
        table.put_item(Item=item)
        return {"incident_id": incident_id, **item}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/incidents")
def list_incidents(
    status: Optional[str] = None,
    tier: Optional[str] = None,
    era: Optional[str] = None,
    limit: int = Query(50, le=200),
):
    try:
        if status:
            resp = table.query(
                IndexName="status-date-index",
                KeyConditionExpression=Key("status").eq(status),
                Limit=limit,
                ScanIndexForward=False,
            )
        else:
            resp = table.scan(Limit=limit)

        items = resp.get("Items", [])

        if tier:
            items = [i for i in items if i.get("tier") == tier]
        if era:
            items = [i for i in items if i.get("era") == era]

        return {"items": items, "count": len(items)}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    try:
        resp = table.get_item(Key={"incident_id": incident_id})
        item = resp.get("Item")
        if not item:
            raise HTTPException(404, "Incident not found")
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@app.put("/incidents/{incident_id}")
def update_incident(incident_id: str, data: IncidentUpdate):
    try:
        item = incident_to_item(incident_id, data.dict())
        table.put_item(Item=item)
        return item
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/incidents/{incident_id}/publish")
def publish_incident(incident_id: str):
    try:
        resp = table.get_item(Key={"incident_id": incident_id})
        item = resp.get("Item")
        if not item:
            raise HTTPException(404, "Incident not found")
        if not item.get("curator_notes"):
            raise HTTPException(400, "Cannot publish without a curator's note")
        if not item.get("title"):
            raise HTTPException(400, "Cannot publish without a title")

        table.update_item(
            Key={"incident_id": incident_id},
            UpdateExpression="SET #s = :s, published_at = :p, updated_at = :u",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":s": "published",
                ":p": now_iso(),
                ":u": now_iso(),
            },
        )
        return {"incident_id": incident_id, "status": "published"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/incidents/{incident_id}/unpublish")
def unpublish_incident(incident_id: str):
    try:
        table.update_item(
            Key={"incident_id": incident_id},
            UpdateExpression="SET #s = :s, updated_at = :u",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":s": "pending", ":u": now_iso()},
        )
        return {"incident_id": incident_id, "status": "pending"}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.delete("/incidents/{incident_id}")
def delete_incident(incident_id: str):
    try:
        table.delete_item(Key={"incident_id": incident_id})
        return {"deleted": incident_id}
    except Exception as e:
        raise HTTPException(500, str(e))


# ── AI Draft ──────────────────────────────────────────────────────────────────
@app.post("/ai/draft")
async def ai_draft(req: AIDraftRequest):
    if not ANTHROPIC_KEY:
        raise HTTPException(500, "ANTHROPIC_API_KEY not configured")

    system = """You are the editorial AI for Vide Verum, a credible UAP encyclopedia written for curious everyday people.

Your job is to write encyclopedia entries that read the way a knowledgeable friend would tell this story. Not a documentary narrator. Not a government report. A person who has read everything about this case and knows how to explain it clearly, without drama, without hype, and without losing the reader.

VOICE:
- Write the way a knowledgeable friend tells a story. Conversational but precise.
- Trust the facts. They are extraordinary enough on their own. Do not add drama.
- Vary your sentence length naturally. Short sentences when something matters. Longer ones when you are building context.
- Let details breathe. Do not stack punchy sentence after punchy sentence.
- Move the story forward chronologically and logically.
- Write for someone who is curious and intelligent but knows nothing about this case.

FLOW:
- Each paragraph should flow naturally into the next.
- Never write two short punchy sentences back to back. That is a screenplay, not an article.
- Never write a summary paragraph at the end that restates what was already said.
- The ending should be the last documented fact or unanswered question. Not a conclusion.

ATTRIBUTION:
- Any description, quote, or detail from a witness must be attributed to that witness.
- Write "Fravor later told investigators the object appeared to move like water" not "the object moved like water."
- The difference between documented fact and witness account must always be clear.

NO EDITORIALIZING:
- Never characterize what something means or implies.
- Never write words like "defied", "impossible", "extraordinary", "inexplicable."
- Never draw conclusions the documented record does not explicitly support.
- If something is unexplained, say it is unexplained. That is enough.

NO SPECULATION:
- Never speculate about what the object was, where it came from, or what it means.
- Never use "could be", "may have been", "some believe", "possibly", "perhaps."
- State only what was documented, witnessed, recorded, or officially acknowledged.

NO DASHES:
- Never use em dashes or en dashes anywhere in the narrative.
- Restructure any sentence that would rely on a dash.

FACT ACCURACY:
- Be precise about who was present, when, and what role they played.
- Never invent corroborating details to fill gaps. If you do not know, leave it out and flag it.
- Flag any detail you are less than 90% confident about in verify_flags.

Always include real, verifiable source URLs where you know them with high confidence."""

    prompt = f"""Draft a complete Vide Verum encyclopedia entry for: "{req.case_name}"

Return ONLY valid JSON (no markdown, no backticks, no preamble):
{{
  "title": "Full descriptive title including location",
  "hook": "One compelling sentence — specific, factual, makes the visitor want to read more",
  "date_display": "Human readable date e.g. Nov 14, 2004",
  "date_sort": "ISO format e.g. 2004-11-14",
  "date_precision": "exact|month|year|decade",
  "location_name": "Specific location",
  "country": "Country",
  "lat": "Latitude as decimal string",
  "lng": "Longitude as decimal string",
  "era": "Pre-modern (before 1947)|Cold War (1947–1969)|Dark years (1970–2000)|Re-disclosure (2001–present)",
  "source_type": "military|government|civilian|congressional|intelligence|academic",
  "narrative": "4-5 paragraphs. Conversational, engaging, factual. Open with the moment — put the reader there. Build through what happened, who witnessed it, how the official response unfolded. Close on what remains unexplained. Write like a journalist, not a bureaucrat. Short paragraphs. Specific details. Make the reader want to keep going.",
  "credibility_score": 4,
  "criteria_met": ["multiple_witnesses","physical_evidence","official_documentation","credentialed_investigation","congressional_testimony","sensor_corroboration"],
  "tier": "featured|verified|pending",
  "physical_evidence": true,
  "cover_up_indicators": false,
  "themes": ["military","nuclear","physical_evidence","cover_up","congressional"],
  "sources": [
    {{
      "type": "Congressional|DoD / Pentagon|AARO|FBI Vault|CIA Reading Room|NARA|FOIA release|Academic paper|Military report|Foreign government|News / journalism|Book",
      "title": "Full source title",
      "url": "https://exact-url-if-known.gov",
      "verified": false
    }}
  ],
  "verify_flags": ["List specific claims, dates, names, or URLs you are less than 90% confident about"],
  "ai_drafted": true
}}"""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                ANTHROPIC_URL,
                headers={
                    "x-api-key": ANTHROPIC_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5",
                    "max_tokens": 2000,
                    "system": system,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["content"][0]["text"]
            # Strip any accidental markdown fences
            text = re.sub(r"```json|```", "", text).strip()
            entry = json.loads(text)
            return entry
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI returned invalid JSON: {e}")
    except httpx.HTTPError as e:
        raise HTTPException(502, f"AI API error: {e}")
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Lambda handler ─────────────────────────────────────────────────────────────
handler = Mangum(app, lifespan="off")
