# infrastructure/videverum

Terraform for the VideVerum corporate website's own AWS resources. Region
`us-east-1` (required for CloudFront + its ACM cert).

## Scope

**Owns** (created/managed here):

| Resource | Name / ID |
|----------|-----------|
| `aws_s3_bucket.site` (+ PAB, ownership, versioning, SSE, lifecycle, policy) | `videverum-prod-site` |
| `aws_cloudfront_origin_access_control.site` | `videverum-prod-site` |
| `aws_cloudfront_distribution.site` | `E3RPD0J7B54UZT` (imported — same distribution as before) |
| `aws_iam_role.deploy` (+ inline `deploy` policy) | `videverum-prod-deploy` |

**References only** (data sources — NOT owned, never recreated):

| Resource | Why |
|----------|-----|
| `data.aws_iam_openid_connect_provider.github` | Account-level shared resource. Pre-exists. |
| `data.aws_acm_certificate.site` | `videverum.com` cert already exists, DNS-validated at Namecheap, auto-renews. Importing it would add recreate risk for no benefit. |

**Not managed anywhere here:** DNS (Namecheap), and the WAF WebACL attached to
the distribution (see "Known follow-ups" in the root README / `docs/aws-cleanup.md`).

## State

Separate, VideVerum-only S3 state with native S3 locking (no DynamoDB):

```
bucket = videverum-prod-tfstate-936922781601
key    = videverum/terraform.tfstate
```

### Bootstrap (already done — for reference / disaster recovery)

The state bucket is created out-of-band so Terraform never has to manage its own
backend:

```bash
B=videverum-prod-tfstate-936922781601
aws s3api create-bucket --bucket $B --region us-east-1
aws s3api put-bucket-versioning --bucket $B --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket $B \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket $B \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'
```

## Import (already done — for reference)

The CloudFront distribution predates this config and is imported, not recreated:

```bash
terraform import aws_cloudfront_distribution.site E3RPD0J7B54UZT
```

Everything else (`videverum-prod-site`, the OAC, the IAM role) was created new by
`terraform apply`. `terraform plan` is clean (no changes).

## Usage

```bash
terraform init
terraform plan     # must show "No changes" on a clean tree
terraform apply
```

Requires AWS credentials with admin-ish reach (S3, CloudFront, IAM). Infra
changes are applied manually by an account owner — **not** through CI. Content
deploys go through GitHub Actions + OIDC (`../../.github/workflows/deploy.yml`).

## Notable variables

| Variable | Default | Notes |
|----------|---------|-------|
| `site_bucket_name` | `videverum-prod-site` | Renaming = new bucket + migration. Not in-place. |
| `cloudfront_web_acl_arn` | `…CreatedByCloudFront-361a05e5…` | The console-auto-created WAF. `~$5/mo`. Set to `""` to detach — a static site has minimal attack surface. Left attached so `apply` makes no silent security change. |
| `github_repo` | `jetty-setter/videverum` | OIDC `sub` claim allow-list. |
| `github_deploy_ref` | `refs/heads/main` | Exact ref match. |

## Outputs

`site_bucket_name`, `cloudfront_distribution_id`, `cloudfront_domain_name`,
`deploy_role_arn`, `acm_certificate_arn`, and ARNs. The GitHub Actions repo
variables (`AWS_DEPLOY_ROLE_ARN`, `SITE_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`,
`AWS_REGION`) are set from these.
