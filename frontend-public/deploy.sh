#!/bin/bash
# deploy.sh — Build and deploy Vide Verum public site to S3/CloudFront
# Usage: ./deploy.sh
#
# Prerequisites:
#   AWS CLI configured with credentials that can write to the S3 bucket
#   and create CloudFront invalidations.
#
# Set these to match your infrastructure:
S3_BUCKET="videverum-public"         # your S3 bucket name
CF_DISTRIBUTION_ID="YOURCLOUDFRONT"  # your CloudFront distribution ID
REGION="us-east-1"

set -e

echo "→ Building..."
node node_modules/vite/bin/vite.js build

echo "→ Syncing to s3://${S3_BUCKET}..."
# Long-lived assets (hashed filenames) — aggressive cache
aws s3 sync dist/assets s3://${S3_BUCKET}/assets \
  --region $REGION \
  --cache-control "public,max-age=31536000,immutable" \
  --delete

# index.html — no cache (SPA entry point)
aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html \
  --region $REGION \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

echo "→ Invalidating CloudFront..."
aws cloudfront create-invalidation \
  --distribution-id $CF_DISTRIBUTION_ID \
  --paths "/*" \
  --region $REGION

echo "✓ Deployed to https://videverum.com"
