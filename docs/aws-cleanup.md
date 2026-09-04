# VideVerum AWS cleanup — record

Companion to [`aws-audit.md`](aws-audit.md) (the Phase 1/2 audit). This file
records what was actually done on **2026-09-03**.

Account `936922781601`, region `us-east-1`. Executed with the `quiccloud` admin
user (local CLI). Content deploys now use GitHub OIDC — no static keys.

---

## Summary

The VideVerum footprint went from "abandoned UFO app with a public bucket and an
orphaned database" to a minimal, private, OIDC-deployed static site:

| Before | After |
|--------|-------|
| `videverum-site` — **public** bucket, S3 website hosting | `videverum-prod-site` — **private**, Block Public Access on, OAC-only |
| CloudFront → S3 **website endpoint over HTTP**, no OAC | CloudFront → S3 **REST endpoint**, Origin Access Control (SigV4) |
| `default_root_object` empty | `index.html` |
| No IaC, no CI, manual `aws s3 sync` with admin keys | Terraform (separate state) + GitHub Actions via OIDC role |
| `vv-incidents` DynamoDB (13 rows, 0 readers) | Exported to `docs/legacy-data/`, table deleted |
| UFO encyclopedia SPA (broken API calls to `localhost:8000`) | Static placeholder page; app archived on `archive/ufo-era` |
| No deploy identity for the repo | `videverum-prod-deploy` IAM role, OIDC, exact-ref scoped |

Distribution `E3RPD0J7B54UZT` and the `videverum.com` ACM certificate were
**kept** (not recreated). DNS was **not** touched.

---

## Legacy resources found

From the audit — the UFO era ("Vide Verum", Latin *see the truth*) left:

| Resource | Disposition |
|----------|-------------|
| `frontend-public/` — public SPA (incident catalog, eras, entry pages) + a half-started merch-shop pivot | Archived → `archive/ufo-era`. Removed from `main`. |
| `frontend-admin/` — editorial admin SPA (never deployed; had 3,733 `node_modules` files committed) | Archived → `archive/ufo-era`. Removed from `main`. |
| `backend/` — FastAPI incident API for Lambda (never deployed) | Archived → `archive/ufo-era`. Removed from `main`. |
| `frontend-public/deploy.sh`, `INFRASTRUCTURE.md`, `BACKEND_ADDITIONS.py` — stale deploy notes with placeholder resource names | Archived. Superseded by real Terraform + workflow. |
| DynamoDB `vv-incidents` — 13 published entries, no live reader | Exported (lossless + plain JSON), count-verified 13=13, table **deleted**. |
| S3 `videverum-site` — public bucket, 6 objects | Content migrated to `videverum-prod-site`, bucket **deleted**. |
| `vv-admin-api` Lambda / ECR / `vv-lambda-role` (referenced in old `DEPLOY.md`) | Never existed. Nothing to remove. |

Naming scan (`ufo`, `alien`, `disclosure`, `sightings`, `truth`, dev/test): **no**
AWS resources matched. The only legacy token was the `vv-` prefix on
`vv-incidents`.

---

## What was created

| Resource | Type | Notes |
|----------|------|-------|
| `videverum-prod-tfstate-936922781601` | S3 bucket | Terraform state. Bootstrapped via CLI (not TF-managed). Versioned, encrypted, BPA on. |
| `videverum-prod-site` | S3 bucket | Private static-site origin. BPA on, `BucketOwnerEnforced`, SSE-S3 + bucket key, versioning on, lifecycle (noncurrent expire 30d, abort MPU 7d), OAC-scoped bucket policy. |
| `videverum-prod-site` | CloudFront OAC | SigV4, `s3`, signing always. |
| `videverum-prod-deploy` | IAM role | Trust: GitHub OIDC, `StringEquals` on `sub` = `repo:jetty-setter/videverum:ref:refs/heads/main`, `aud` = `sts.amazonaws.com`. Inline policy: `s3:ListBucket` on the bucket, `s3:{Put,Get,Delete}Object` on `/*`, `cloudfront:{CreateInvalidation,GetInvalidation}` on the one distribution. `max_session_duration` 3600. |
| GitHub repo variables | Actions vars | `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `SITE_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`. |
| `.github/workflows/deploy.yml` | workflow | OIDC deploy. `id-token: write`, `contents: read`. |
| `site/` | static site | `index.html` placeholder, `favicon.svg`, `robots.txt`. |
| `infrastructure/videverum/*.tf` | Terraform | s3, cloudfront, iam, acm, variables, outputs, versions. |
| `archive/ufo-era` | git branch | Full pre-cleanup snapshot incl. uncommitted WIP. Pushed to origin. |
| `docs/legacy-data/vv-incidents.json` + `.plain.json` | data export | 13 records, both formats. |

## What was modified

| Resource | Change |
|----------|--------|
| CloudFront `E3RPD0J7B54UZT` | Origin: S3 website endpoint (custom origin, http-only) → S3 REST endpoint (`videverum-prod-site.s3.us-east-1.amazonaws.com`) + OAC. `default_root_object`: `""` → `index.html`. Origin id renamed. Tags → `Project/Env/ManagedBy/Repo`. **Kept:** aliases, ACM cert, viewer policy (redirect-to-https, TLS1.2_2021), custom error responses (403/404→/index.html), `PriceClass_All`*, WAF association, IPv6, HTTP/2. Imported into Terraform — not recreated. |
| GitHub repo `jetty-setter/videverum` | New branch `archive/ufo-era`; `main` history: `.gitignore`, data export + audit, UFO removal + IaC + workflow, docs. |

\* `PriceClass_100` (audit item 8) could **not** be applied: the distribution is
on CloudFront's "Free" pricing plan, which rejects an explicit price class. The
free plan already caps billable usage, so this is at least as cheap as
PriceClass_100 would have been.

## What was deleted

| Resource | Safeguards before deletion |
|----------|----------------------------|
| DynamoDB table `vv-incidents` | Export committed to `main` (`eeab2ab`); `archive/ufo-era` pushed; `scan --select COUNT` = 13 = export count; no CloudFront/Lambda/stream references. |
| S3 bucket `videverum-site` | Never versioned (no version history to lose); contents already synced to `videverum-prod-site` and validated live; no CloudFront distribution referenced it; `deploy.sh` referencing it was removed. |

## What was retained (and why)

- **CloudFront `E3RPD0J7B54UZT`** — live distribution for `videverum.com`;
  recreating it changes the `*.cloudfront.net` domain and breaks DNS.
- **ACM cert `…/fb163404` (`videverum.com`, `www`)** — in use by the
  distribution, DNS-validated, auto-renews (expires 2027-01-07). Referenced as a
  data source; not imported (its validation CNAMEs are at Namecheap).
- **GitHub OIDC provider** `token.actions.githubusercontent.com` — account-level
  shared resource; referenced, not owned.
- **Namecheap DNS** — unchanged. All records still point at the same CloudFront
  domain.

## Intentionally left for manual review

1. **WAF WebACL `CreatedByCloudFront-361a05e5`** (attached to the distribution).
   Console-auto-created, 3 AWS managed rule groups, **~$5/month** — the single
   largest VideVerum cost, on a static site with no origin compute. Terraform
   keeps it attached (`cloudfront_web_acl_arn` var) so nothing changes silently.
   **Recommendation:** detach it — set `cloudfront_web_acl_arn = ""` and
   `terraform apply`, then delete the WebACL in the console. Requires a
   deliberate "yes, drop the WAF" from an owner.
2. **`videverum.com` → Route 53 migration.** Out of scope this phase. Needs the
   full Namecheap zone reviewed first — especially the 5 `eforward*` MX records
   (email forwarding) and the ACM validation CNAMEs — recreated in a Route 53
   zone before the nameserver cutover.
3. **`site/` placeholder → real corporate site.** Deliberately not designed here.
4. **CloudFront access logging / security headers response policy** — not
   configured. Fine for a placeholder; consider when the real site ships.

## Explicitly NOT touched (out of scope)

RabbitHole, QuicLens, PureZen, and stephsimmons.dev resources — verified
unchanged (see the completion report). Also untouched: IAM users `quiccloud`,
`rabbithole-deploy`, `purezen-admin`; RabbitHole IAM roles / ECR / log
retention; QuicLens naming / certificates; shared CDK resources. Findings about
those (broad admin static keys, missing ECR lifecycle policies, never-expire log
groups, duplicate unused `quiclens.com` cert, failed `www.stephsimmons.dev`
cert, second `CreatedByCloudFront-*` WAF on stephsimmons.dev) are recorded in
`aws-audit.md` §3–4 for their respective owners.

---

## Future: AWS account separation

All products currently share account `936922781601`. A cleaner long-term model,
when any product's blast radius or billing needs isolation:

```
AWS Organization (management account — billing only)
├── videverum-prod      corporate site (this repo)
├── rabbithole-prod     + rabbithole-dev
├── quiclens-prod       + quiclens-dev
└── shared-services     OIDC provider, org-wide guardrails, DNS delegation
```

Migration path: stand up the Organization, create per-product accounts, move
each product's IaC to deploy cross-account, re-issue OIDC roles per account,
transfer Route 53 zones / ACM certs, then decommission the shared account's
per-product resources. VideVerum's footprint is small enough to move first as
the pilot.
