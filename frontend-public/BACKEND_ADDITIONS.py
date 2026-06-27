# ── ADD THESE ROUTES TO YOUR EXISTING main.py ──────────────────────────────
# Drop these before the `handler = Mangum(app)` line at the bottom.
# These are the two new public-site endpoints.

# GET /incidents/slug/{slug}
# Returns a single published incident by its slug field.
# Used by Entry.tsx at /entry/:slug
@app.get("/incidents/slug/{slug}")
async def get_incident_by_slug(slug: str):
    """Look up a published incident by slug. Used by the public Entry page."""
    # Scan for the slug — add a GSI on 'slug' if this becomes slow
    result = table.scan(
        FilterExpression=Attr("slug").eq(slug) & Attr("status").eq("published")
    )
    items = result.get("Items", [])
    if not items:
        raise HTTPException(status_code=404, detail="Entry not found")
    return items[0]


# GET /stats
# Returns aggregate counts for the homepage stats bar.
@app.get("/stats")
async def get_stats():
    """Aggregate counts for the public homepage stats bar."""
    result = table.scan(
        FilterExpression=Attr("status").eq("published"),
        ProjectionExpression="tier, era",
    )
    items = result.get("Items", [])

    total = len(items)
    featured = sum(1 for i in items if i.get("tier") == "featured")
    verified = sum(1 for i in items if i.get("tier") == "verified")
    eras = len({i.get("era") for i in items if i.get("era")})

    return {"total": total, "featured": featured, "verified": verified, "eras": eras}
