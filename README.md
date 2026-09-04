# VideVerum

VideVerum is the parent company behind a small family of independent software
products (RabbitHole, QuicLens, and others). This repository holds **only** the
VideVerum corporate website and the infrastructure that serves it.

The site was previously a UFO/UAP encyclopedia ("Vide Verum"). That application
has been retired — its full source is on the [`archive/ufo-era`](https://github.com/jetty-setter/videverum/tree/archive/ufo-era)
branch and its editorial data is in [`docs/legacy-data/`](docs/legacy-data/).
See [`docs/aws-cleanup.md`](docs/aws-cleanup.md) for what changed and why.

---

## Architecture

```
Browser
  → DNS: videverum.com / www.videverum.com   (Namecheap DNS — NOT Route 53 yet)
        apex ALIAS + www CNAME → d1gcyhqv1qd8as.cloudfront.net
  → CloudFront distribution E3RPD0J7B54UZT
        aliases: videverum.com, www.videverum.com
        TLS: ACM cert for videverum.com (us-east-1, auto-renewing)
        viewer: redirect-to-https, TLS 1.2_2021
        default root object: index.html
        SPA fallback: 403 & 404 → /index.html (200)
        WAF: CreatedByCloudFront-361a05e5 (see "Known follow-ups")
  → Origin Access Control (SigV4, s3)
  → S3 bucket "videverum-prod-site"  (us-east-1)
        Block Public Access: ON (all four)
        Bucket policy: s3:GetObject to cloudfront.amazonaws.com,
                       scoped to this distribution's ARN only
        SSE-S3 (AES256), versioning ON,
        lifecycle: expire noncurrent versions after 30 days
```

There is **no** backend, API, Lambda, or database. The site is fully static.

### Environments

| Env | Domain | Bucket | Distribution | State |
|-----|--------|--------|--------------|-------|
| prod | videverum.com | `videverum-prod-site` | `E3RPD0J7B54UZT` | `s3://videverum-prod-tfstate-936922781601/videverum/terraform.tfstate` |

There is no `dev` environment. If one is ever needed, add `videverum-dev-*`
resources in a parallel Terraform workspace/state — do not overload prod.

### DNS

`videverum.com` is registered at **Namecheap** and its DNS is served by
Namecheap (`dns1.registrar-servers.com` / `dns2...`). Terraform here does **not**
manage DNS. Relevant records currently in that zone:

| Record | Type | Value |
|--------|------|-------|
| `videverum.com` | ALIAS/A | `d1gcyhqv1qd8as.cloudfront.net` |
| `www.videverum.com` | CNAME | `d1gcyhqv1qd8as.cloudfront.net` |
| `videverum.com` | MX (x5) | `eforward1..5.registrar-servers.com` (Namecheap email forwarding) |
| ACM validation | CNAME (x2) | `_….acm-validations.aws` |

A future migration to Route 53 must recreate **all** of these — especially the
MX records — before changing nameservers. That is deliberately out of scope here.

---

## Deploying

### Content (the website)

Automatic. Push to `main` with changes under `site/` and
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs:

1. Assume `videverum-prod-deploy` via GitHub OIDC (no stored AWS keys).
2. `aws s3 sync site/ s3://videverum-prod-site` (static assets, long cache, `--delete`).
3. Upload `index.html` / `robots.txt` with `Cache-Control: no-cache`.
4. `aws cloudfront create-invalidation --paths "/*"`.

You can also trigger it manually from the Actions tab (`workflow_dispatch`).

`site/` is currently a hand-written placeholder — no build step. When the real
corporate site is built (any stack), keep the contract: the workflow deploys
whatever ends up in `site/` (add a build step before the sync if the stack needs
one).

### Infrastructure (Terraform)

Applied manually by an account admin — infra changes are rare and privileged.

```bash
cd infrastructure/videverum
terraform init
terraform plan
terraform apply
```

See [`infrastructure/videverum/README.md`](infrastructure/videverum/README.md)
for state bootstrap, imports, and the OIDC/IAM model.

---

## How products are separated

VideVerum is the parent company, **not** a shared account for every product.

- This repo owns **only** the VideVerum corporate site.
- RabbitHole and QuicLens live in their own repos with their own IaC, their own
  deploy roles, and their own state. Do not add `rabbithole/` or `quiclens/`
  directories here.
- Shared, account-level resources (the GitHub Actions OIDC provider, CDK
  bootstrap) are **referenced** by this config, never **owned** by it.
- All products currently share one AWS account (`936922781601`). Splitting into
  per-product accounts under AWS Organizations is a possible future step
  (sketched in `docs/aws-cleanup.md`).

---

## Safely modifying infrastructure

- **Never** delete or rename the CloudFront distribution, the ACM certificate,
  or the Route-53-bound records without a migration plan — they are on the
  serving path for a live domain.
- Run `terraform plan` and read every line before `apply`. A plan that wants to
  **destroy/replace** `aws_cloudfront_distribution.site` is wrong — stop.
- The S3 bucket cannot be renamed in place. Changing `site_bucket_name` means a
  new bucket + content migration + origin swap + invalidation, in that order.
- Keep the deploy role least-privilege: one bucket, one distribution. If a build
  step needs more, scope it tightly.
- No secrets belong in this repo or in Terraform. The deploy path uses OIDC;
  there are no AWS access keys to store.
- Don't touch RabbitHole / QuicLens / PureZen / stephsimmons.dev resources from
  here.
