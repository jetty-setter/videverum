# Vide Verum Admin — Deployment Guide

## Architecture

Same pattern as QuicLens:
- **Frontend**: React/Vite → S3 → CloudFront at `videverum.com/admin/`
- **Backend**: FastAPI → Lambda (Docker/ECR) → API Gateway
- **Database**: DynamoDB `vv-incidents`
- **Auth**: WorkOS (same setup as QuicLens) — admin only

---

## Local development

### Backend
```bash
cd backend
pip install -r requirements.txt
DYNAMO_TABLE=vv-incidents AWS_REGION=us-east-1 ANTHROPIC_API_KEY=sk-ant-xxx uvicorn main:app --reload
# API runs at http://localhost:8000
```

### Frontend
```bash
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8000
npm install
npm run dev
# Admin runs at http://localhost:3001/admin/
```

---

## DynamoDB table setup

Run this once to create the table:

```bash
aws dynamodb create-table \
  --table-name vv-incidents \
  --key-schema AttributeName=incident_id,KeyType=HASH \
  --attribute-definitions \
    AttributeName=incident_id,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=date_sort,AttributeType=S \
    AttributeName=source_type,AttributeType=S \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    '[{"IndexName":"status-date-index","KeySchema":[{"AttributeName":"status","KeyType":"HASH"},{"AttributeName":"date_sort","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"source_type-date-index","KeySchema":[{"AttributeName":"source_type","KeyType":"HASH"},{"AttributeName":"date_sort","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --region us-east-1
```

---

## Backend deployment (Lambda/ECR)

### Dockerfile
```dockerfile
FROM public.ecr.aws/lambda/python:3.12
COPY requirements.txt .
RUN pip install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"
COPY main.py "${LAMBDA_TASK_ROOT}"
CMD ["main.handler"]
```

### Deploy
```bash
# Build and push to ECR (same pattern as QuicLens)
aws ecr create-repository --repository-name vv-admin-api --region us-east-1
docker build -t vv-admin-api .
docker tag vv-admin-api:latest ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/vv-admin-api:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/vv-admin-api:latest

# Create Lambda function
aws lambda create-function \
  --function-name vv-admin-api \
  --package-type Image \
  --code ImageUri=ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/vv-admin-api:latest \
  --role arn:aws:iam::ACCOUNT:role/vv-lambda-role \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{DYNAMO_TABLE=vv-incidents,ANTHROPIC_API_KEY=sk-ant-xxx}"
```

### IAM role needs
- `dynamodb:*` on `arn:aws:dynamodb:us-east-1:*:table/vv-incidents*`
- `logs:CreateLogGroup`, `logs:PutLogEvents`

---

## Frontend deployment (S3/CloudFront)

```bash
# Build
npm run build

# Upload to S3 (same bucket as videverum-site)
aws s3 sync dist/ s3://videverum-site/admin/ \
  --content-type "text/html" \
  --cache-control "max-age=300"

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/admin/*"
```

The admin will be live at `https://videverum.com/admin/`

---

## Environment variables

### Lambda (backend)
| Variable | Value |
|----------|-------|
| `DYNAMO_TABLE` | `vv-incidents` |
| `AWS_REGION` | `us-east-1` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

### Vite (frontend build)
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your API Gateway URL |

---

## WorkOS auth (protect the admin)

Add WorkOS auth to the Lambda — same pattern as QuicLens:

```python
# In main.py, add middleware:
from workos import WorkOSClient

workos = WorkOSClient(api_key=os.getenv("WORKOS_API_KEY"))

# Protect all routes with a dependency:
async def require_auth(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    try:
        user = workos.user_management.get_user(token)
        return user
    except:
        raise HTTPException(401, "Unauthorized")
```

---

## AI draft cost estimate

Using Haiku 4.5 ($1/$5 per million tokens):
- One complete draft: ~300 input + 700 output = ~$0.004
- 20 Featured entries: ~$0.08
- 100 total entries: ~$0.40
- Ongoing monthly (10 new entries/month): ~$0.04/month

Total AI cost for the entire encyclopedia: under $1.
