# INFRASTRUCTURE NOTES — Vide Verum Public Site
# ─────────────────────────────────────────────
# This is a React SPA with client-side routing.
# CloudFront + S3 need one non-obvious config to make deep links work.

## S3 Bucket
- Static website hosting: enabled
- Index document: index.html
- Error document: index.html  ← THIS IS REQUIRED for /entry/:slug, /catalog, etc.

## CloudFront
- Origin: S3 website endpoint (not S3 REST endpoint)
- Default root object: index.html
- Add a custom error response:
    HTTP error code:    403 or 404
    Response page path: /index.html
    HTTP response code: 200
  This is what makes /entry/roswell-1947 work on direct load.

## CORS
The FastAPI backend needs these CORS origins in production:
  allow_origins=["https://videverum.com", "https://www.videverum.com"]

## Backend slug route
See BACKEND_ADDITIONS.py — add the /incidents/slug/{slug} and /stats routes.
If your vv-incidents DynamoDB table doesn't have a GSI on 'slug', the slug
lookup will use a table scan. Add a GSI (slug-index, hash key: slug) to avoid
that for a larger catalog.

Suggested GSI:
  Index name:       slug-index
  Partition key:    slug (String)
  Projection:       ALL
  Billing:          On-demand (matches table)
