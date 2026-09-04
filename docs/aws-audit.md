# VideVerum AWS Audit — Phase 1 & 2

**Date:** 2026-09-03
**Account:** `936922781601` (single shared account for all products)
**Auditor identity used:** `arn:aws:iam::936922781601:user/quiccloud` (profile `default`) — note this
user is in the `Admins` group (full `AdministratorAccess`).
**Status:** AUDIT ONLY. No resources changed. No destructive actions taken.

---

## 0. TL;DR

- **VideVerum's real footprint is tiny already:** 1 S3 bucket, 1 CloudFront distribution, 1 ACM
  cert, 1 DynamoDB table. No Lambda, no API Gateway, no ECR, no IAM role, no OIDC, no Route 53 zone.
- **The VideVerum application backend was never deployed.** The live site
  (`https://videverum.com`) is a static React SPA that was built with
  `VITE_API_URL=http://localhost:8000` baked in, so every API call it makes (featured entries,
  stats, catalog) fails in production. The site is a broken UFO‑encyclopedia shell.
- **`vv-incidents` DynamoDB** holds 13 real published UFO encyclopedia entries but nothing reads
  them. It is orphaned editorial data (costs ~$0/mo on-demand).
- **The account is shared** by at least 5 products: VideVerum, RabbitHole, QuicLens (aka
  "quiccloud"), PureZen, and a personal site (`stephsimmons.dev`). Only VideVerum, RabbitHole and
  QuicLens are in scope. **PureZen and stephsimmons.dev must not be touched.**
- **DNS for `videverum.com` is at Namecheap** (`dns1.registrar-servers.com`), not Route 53.
- **Two static-key IAM users hold full admin:** `quiccloud` (via `Admins` group) and
  `rabbithole-deploy` (`AdministratorAccess` attached). Both have active access keys.
- Cleanup here is about **clarity, naming, security posture, and a proper deploy pipeline** — not
  cost. VideVerum's AWS spend is already under ~$1/month.

---

## 1. What powers `videverum.com` today (request path)

```
Browser
  → DNS: videverum.com / www.videverum.com  (Namecheap DNS, registrar-servers.com)
      CNAME/ALIAS → d1gcyhqv1qd8as.cloudfront.net
  → CloudFront distribution E3RPD0J7B54UZT
      Aliases: videverum.com, www.videverum.com
      Viewer cert: ACM videverum.com (arn …/fb163404-ccd6-4e28-a5b1-3492051e7aa3)
      Viewer protocol: redirect-to-https, TLS 1.2_2021
      SPA fallback: 403 & 404 → /index.html (200)
      Price class: PriceClass_All
  → Origin: videverum-site.s3-website-us-east-1.amazonaws.com
      (S3 *website* endpoint, HTTP-only, NO Origin Access Control)
  → S3 bucket "videverum-site" (us-east-1)
      Public: bucket policy allows s3:GetObject to "*"; Block Public Access = OFF
      Static website hosting ON; SSE-S3 (AES256); no versioning
      6 objects, ~2.4 MB (2.1 MB is logo.png)
      Contents = Vite build of frontend-public (June 2026)

Application/backend: NONE DEPLOYED.
  The SPA's api.ts points at http://localhost:8000 (baked into the live bundle).
  No Lambda, no API Gateway, no container serving the VideVerum API exists.

Data: DynamoDB "vv-incidents" (us-east-1) — 13 items, ~84 KB, PAY_PER_REQUEST,
  GSIs status-date-index & source_type-date-index. Not referenced by any running compute.
```

**Admin app** (`frontend-admin/`, `backend/`): designed for
`videverum.com/admin/` + FastAPI on Lambda/ECR + WorkOS auth (`frontend-admin/DEPLOY.md`).
**None of it was ever deployed** — no `/admin/*` objects in the bucket, no `vv-admin-api`
Lambda/ECR/role, no CloudWatch log group.

---

## 2. Full resource inventory & classification

Legend: **KEEP-VV** / **KEEP-RH** (RabbitHole) / **KEEP-QL** (QuicLens) / **KEEP-OTHER**
(PureZen / personal — out of scope, do not touch) / **KEEP-SHARED** / **MIGRATE-RENAME** /
**DELETE?** / **REVIEW** (unknown — leave untouched).

### S3 buckets
| Bucket | Owner | Class | Notes |
|---|---|---|---|
| `videverum-site` | VideVerum | **MIGRATE-RENAME** | Live origin. Rename target `videverum-prod-site`. Public + website hosting → move to private + OAC. Can't rename in place (new bucket) — see plan. |
| `rabbithole-dev-frontend-936922781601` | RabbitHole | KEEP-RH | CF E44SKFZVQZ8BJ origin |
| `rabbithole-dev-streaming-936922781601` | RabbitHole | KEEP-RH | CF E37EU9UDPVMWZP (HLS) |
| `rabbithole-dev-uploads-936922781601` | RabbitHole | KEEP-RH | |
| `rabbithole-dev-tfstate-936922781601` | RabbitHole | KEEP-RH | Terraform state |
| `quiccloud-raw-uploads` | QuicLens | KEEP-QL | data-plane uploads |
| `quiclensstack-frontendbucketefe2e19c-p7wddqblht3g` | QuicLens | KEEP-QL | CDK-managed, CF E36J1202V7NZGU |
| `quiclensstack-archivebucket9decbf5d-6cseh1xxitwi` | QuicLens | KEEP-QL | CDK-managed |
| `cdk-hnb659fds-assets-936922781601-us-east-1` | Shared (CDK bootstrap) | KEEP-SHARED | used by QuicLens + PureZen CDK |
| `purezenstack-frontendbucketefe2e19c-j3mm0n5ao2nq` | PureZen | KEEP-OTHER | out of scope |
| `stephsimmons-site-prod` | personal | KEEP-OTHER | out of scope |

### CloudFront
| Id | Aliases | Owner | Class |
|---|---|---|---|
| `E3RPD0J7B54UZT` | videverum.com, www | VideVerum | **KEEP-VV** (reconfigure: OAC + private origin; consider PriceClass_100) |
| `E36J1202V7NZGU` | quiclens.com, www, quiclens.stephsimmons.dev | QuicLens | KEEP-QL |
| `E44SKFZVQZ8BJ` | rabbithole.stephsimmons.dev | RabbitHole | KEEP-RH |
| `E37EU9UDPVMWZP` | (none) | RabbitHole | KEEP-RH (HLS streaming) |
| `E38YI0DD9S3RRK` | stephsimmons.dev, www | personal | KEEP-OTHER |
| `EC926QWGFLEQB` | purezen.stephsimmons.dev | PureZen | KEEP-OTHER |

### Route 53
| Zone | Class | Notes |
|---|---|---|
| `stephsimmons.dev.` (Z02906051XRHQU9F2T2Y9) | KEEP-OTHER | Only hosted zone in the account. **No zone for videverum.com or quiclens.com.** |

**`videverum.com` DNS is at Namecheap.** Moving it to Route 53 (a stated goal) is a manual
nameserver cutover — **REVIEW / manual approval**.

### ACM (us-east-1 — only region that matters for CloudFront)
| Cert | Domain | InUse | Class |
|---|---|---|---|
| `…/fb163404…` | videverum.com (+www) | yes (E3RPD0J7B54UZT) | **KEEP-VV**. Expires 2027-01-07, auto-renew ELIGIBLE. |
| `…/3ed9aeab…` | quiclens.com (+www) | yes | KEEP-QL |
| `…/37dec03b…` | *.stephsimmons.dev | yes | KEEP-OTHER |
| `…/3b0c8d51…` | quiclens.com (+www) | **no** | REVIEW (QuicLens owner) — duplicate unused cert |
| `…/646da9ac…` | www.stephsimmons.dev | no, **VALIDATION_TIMED_OUT** | DELETE? (personal, trivial) — not VideVerum |

### DynamoDB
| Table | Owner | Class |
|---|---|---|
| `vv-incidents` | VideVerum (UFO era) | **DELETE? after export** — 13 published entries, 0 readers. On-demand, ~$0/mo. Export to `docs/legacy-data/` then drop. **Manual approval.** |
| `rabbithole-dev-*` (5) | RabbitHole | KEEP-RH |
| `quiccloud_*` (11), `quiclens_*` (5) | QuicLens | KEEP-QL |
| `purezen*` (9) | PureZen | KEEP-OTHER |

### Lambda / API Gateway / ECR / ECS / SQS / EventBridge / SNS
- **VideVerum: none.** No functions, APIs, repos, queues, rules, topics.
- `rabbithole-dev-*` Lambdas (10), APIGW v2 `rabbithole-dev-ws` + `-http`, ECS cluster
  `rabbithole-dev` (service `rabbithole-dev-worker`, **desiredCount 0** — scale-to-zero),
  ECR `rabbithole-dev-api` (134 imgs), `rabbithole-dev-worker` (119 imgs), SQS
  `rabbithole-dev-jobs`(+dlq), EventBridge `rabbithole-dev-*` (3) → **KEEP-RH**.
- `QuicLensStack-*` / `PureZenStack-*` Lambdas, APIGW v1 `QuicLensGateway` / `PureZenGateway`,
  ECR `cdk-hnb659fds-container-assets-*` → KEEP-QL / KEEP-OTHER.
- `/aws/apigateway/welcome` log group (109 B) — orphan console artifact, ignore or delete.

### VPC / NAT / EIP / ALB / RDS / EC2 / EBS snapshots
- **None owned by VideVerum. Account-wide: no NAT gateways, no Elastic IPs, no load balancers,
  no RDS, no EC2 instances, no EBS snapshots.** Default VPC `vpc-0816…` (unused) +
  `rabbithole-dev-vpc` (10.0.0.0/16, RabbitHole).

### IAM
| Principal | Type | Class / finding |
|---|---|---|
| user `quiccloud` | static key (active, 2026-05-05) | **REVIEW/SECURITY** — in `Admins` group (`AdministratorAccess`) **plus** `AmazonS3FullAccess` + `AmazonDynamoDBFullAccess` attached directly. This is the key in use now. Likely the human owner's CLI user; also whatever deploys `videverum-site` today (manual `aws s3 sync`). |
| user `rabbithole-deploy` | static key (active, 2026-06-08) | **SECURITY** — `AdministratorAccess`. RabbitHole already has OIDC roles (`rabbithole-dev-deploy`, `rabbithole-dev-terraform`); this user should be retired. RabbitHole owner's call. |
| user `purezen-admin` | static key (active, 2026-04-30) | KEEP-OTHER — `AmazonDynamoDBFullAccess`, PureZen. |
| role `stephsimmons-site-deploy` | GitHub OIDC (`repo:jetty-setter/stephsimmons:ref:refs/heads/main`) | KEEP-OTHER — **good reference pattern** (scoped S3 put/delete + single CF invalidation). |
| roles `rabbithole-dev-deploy`, `rabbithole-dev-terraform` | GitHub OIDC (`repo:jetty-setter/rabbithole`) | KEEP-RH |
| roles `rabbithole-dev-*` (api-lambda, worker, ecs-exec, broadcaster, scaleup/down, transcribe…) | workload roles | KEEP-RH |
| roles `cdk-hnb659fds-*` (5) | CDK bootstrap | KEEP-SHARED (QuicLens + PureZen) |
| roles `QuicLensStack-*`, `PureZenStack-*` | CDK workload roles | KEEP-QL / KEEP-OTHER |
| policy `rabbithole-dev-api` (customer-managed, 0 attachments) | REVIEW-RH — orphaned |
| OIDC provider `token.actions.githubusercontent.com` | KEEP-SHARED — **reuse for VideVerum** |
| **No `videverum-*` / `vv-*` IAM principal exists.** | — | Gap: VideVerum has no deploy identity. |

### Secrets Manager / SSM
- Secrets Manager: **empty**.
- SSM: `/cdk-bootstrap/hnb659fds/version` (shared), `/rabbithole-dev/anthropic-api-key`
  (SecureString, RabbitHole). **Nothing for VideVerum.**

### CloudWatch Logs (retention findings — informational, mostly not VideVerum)
- VideVerum: **no log groups.**
- Never-expire (`retentionInDays: null`): all `rabbithole-dev-*` groups (biggest:
  `/aws/lambda/rabbithole-dev-api` ~5.9 MB), all `PureZenStack-*`, two `QuicLens…AutoDelete`
  groups, `/aws/apigateway/welcome`. → recommend retention on the owning products, out of scope
  for VideVerum cleanup.

### Budgets / Alarms
- Budget `rabbithole-monthly` $5. **No account-wide budget.** CW alarm `Billing`
  (EstimatedCharges) exists → OK. SNS `Billing` / `BillingAlarm` topics.

---

## 3. Cost / waste risks

VideVerum-attributable cost is **negligible (<$1/mo)**. Findings, worst first:

| Item | Est. monthly | Action |
|---|---|---|
| CloudFront `E3RPD0J7B54UZT` PriceClass_All for a low-traffic corporate site | pennies now, scales with edge usage | Set `PriceClass_100` |
| `videverum-site` — 2.1 MB `logo.png` shipped uncompressed | trivial storage; real cost is viewer bandwidth | Optimize asset in the new build |
| `vv-incidents` on-demand, 0 reads | ~$0 (storage only) | Export + delete (approval) |
| ACM `3b0c8d51` duplicate unused `quiclens.com` cert | $0 (ACM public certs free) | QuicLens owner deletes |
| ACM `646da9ac` failed `www.stephsimmons.dev` | $0 | personal — delete anytime |
| **Account-wide, NOT VideVerum:** ECR `rabbithole-dev-api` (134) + `rabbithole-dev-worker` (119) images, no lifecycle policy | ~$0.10–1.00 | RabbitHole owner adds lifecycle policy (keep deployed) |
| RabbitHole never-expire log groups | ~cents growing | RabbitHole owner sets retention |

**No NAT gateways, Elastic IPs, load balancers, RDS, idle EC2, or stale snapshots anywhere in
the account.** ECS worker is scaled to 0. There is no large hidden spend.

---

## 4. Security / IAM findings

1. **`quiccloud` user = de facto root.** `Admins` group (`AdministratorAccess`) + direct
   `S3FullAccess` + `DynamoDBFullAccess`, active static key since May. Used for this audit and
   almost certainly for manual `videverum-site` deploys. → VideVerum deploys should move to a
   scoped GitHub OIDC role; the human user's broad access is a separate decision for the owner.
2. **`rabbithole-deploy` user has `AdministratorAccess` + static key** while OIDC roles for the
   same repo already exist. Classic "replace user with role." RabbitHole owner's call — **flag,
   do not touch**.
3. **`videverum-site` S3 bucket is public** (bucket policy `Principal:"*"`, Block Public Access
   fully OFF) and CloudFront pulls from the **HTTP-only website endpoint** with **no OAC**.
   Anyone can hit the bucket directly, bypassing CloudFront. → move to private bucket + OAC +
   REST endpoint + restore Block Public Access.
4. **CORS in `backend/main.py` is `allow_origins=["*"]` with `allow_methods/headers=["*"]`** —
   only matters if the backend is ever deployed; note for when/if VideVerum needs server-side
   behavior (it currently does not).
5. **No secrets committed** — `git grep` across all history found only `sk-ant-xxx` placeholders
   in `frontend-admin/DEPLOY.md`. `frontend-public/.env` (`VITE_API_URL=localhost`) is untracked.
6. **`purezen-admin`** static key — out of scope, note for PureZen owner.
7. OIDC trust conditions on RabbitHole roles use `StringLike` on `sub` with an exact string
   (fine) — a VideVerum role should use `StringEquals` on
   `repo:jetty-setter/videverum:ref:refs/heads/main` like `stephsimmons-site-deploy` does.

---

## 5. Recommended target architecture (VideVerum corporate site)

Deliberately minimal — "the sophistication belongs in the products."

```
                 ┌─────────────────────────── GitHub: jetty-setter/videverum
                 │  Actions workflow (deploy.yml), OIDC, no static keys
                 │      └─ assume role: videverum-prod-deploy
                 ▼
Browser ─► Route 53  (NEW hosted zone videverum.com — after NS cutover from Namecheap)
             │  ALIAS videverum.com + www  ─────────────┐
             ▼                                          │
        CloudFront  (E3RPD0J7B54UZT, kept & reconfigured)
             │  ACM cert videverum.com (fb163404, kept)
             │  PriceClass_100
             │  SPA fallback 403/404 → /index.html
             │  Origin Access Control (SigV4)
             ▼
        S3  videverum-prod-site  (PRIVATE — Block Public Access ON)
             bucket policy: allow only this CloudFront distribution via OAC
             SSE-S3, versioning ON, lifecycle: expire noncurrent @ 30d
```

- **No** Lambda / API Gateway / DynamoDB / ECS / SQS / Cognito / Secrets Manager. The corporate
  site is static. If a contact form is ever needed → a single Lambda Function URL behind
  CloudFront, or a third-party form service. Not now.
- **IAM:** one role `videverum-prod-deploy`, GitHub OIDC, trust locked to
  `repo:jetty-setter/videverum:ref:refs/heads/main`, permissions = `s3:PutObject/DeleteObject/
  GetObject/ListBucket` on the one bucket + `cloudfront:CreateInvalidation` on the one
  distribution. Mirrors `stephsimmons-site-deploy`.
- **IaC:** introduce Terraform (there is none today). Proposed layout:
  ```
  infrastructure/
    videverum/     # this site: S3, CloudFront, OAC, ACM data source, Route53, OIDC role
    shared/        # OIDC provider (import existing), account budget
    README.md
  # rabbithole/ and quiclens/ live in their own repos — documented, not moved here
  ```
  State: local `terraform/videverum.tfstate` promoted to an S3 backend
  `videverum-prod-tfstate-936922781601` (new, private, versioned). Separate from RabbitHole's
  state bucket.
- **Naming convention going forward:** `videverum-prod-*`, `rabbithole-prod-*`,
  `quiclens-prod-*` (and `-dev-` where a dev env genuinely exists). RabbitHole is currently
  `rabbithole-dev-*` with no prod — renaming its live resources would force
  destroy/recreate, so that is **out of scope** and left to the RabbitHole repo.

---

## 6. Changes that are safe to perform automatically (non-destructive, reversible)

These do not touch live traffic, other products, or data:

| # | Change | Why safe |
|---|---|---|
| A | **Repo hygiene:** add `frontend-admin/.gitignore`, `git rm -r --cached frontend-admin/node_modules` (3,733 files committed), remove duplicated loose files in `frontend-public/` root (`App.tsx`, `deploy.sh`, `INFRASTRUCTURE.md`, `BACKEND_ADDITIONS.py`, … — the real code is in `frontend-public/src/`). | Code only, git-reversible. |
| B | **Add Terraform** under `infrastructure/videverum/` that **imports** the existing bucket, CloudFront distro and ACM cert into state with **zero planned changes** (a "describe current state" baseline). | `terraform import` + a plan that shows no diffs changes nothing in AWS. |
| C | **Create `videverum-prod-deploy` IAM role** (GitHub OIDC, scoped) + a `.github/workflows/deploy.yml` that builds `frontend-public` and syncs to the bucket. Wire the correct bucket/distribution IDs (today's `deploy.sh` has placeholders). | New role, additive. Nothing else can assume it. |
| D | **Enable S3 versioning** on `videverum-site` + add a lifecycle rule for noncurrent versions. | Additive, no downtime, improves recoverability. |
| E | **Set CloudFront to `PriceClass_100`.** | Config change, no downtime, cheaper; instantly reversible. |
| F | **Fix the broken build:** set `VITE_API_URL` appropriately (or strip the dead API layer from `frontend-public` as part of Phase 4) so the deployed site stops making failing `localhost:8000` calls. | Frontend code; deploy is gated by your approval. |
| G | **Export `vv-incidents` to `docs/legacy-data/vv-incidents.json`** in the repo. | Read-only; preserves the data before any later deletion. |
| H | **Write `README.md` + `docs/aws-cleanup.md`.** | Docs only. |
| I | **Add an account-wide AWS Budget** (e.g. $25/mo) with alerts. | Additive, no resource impact. |

## 7. Changes that require your explicit approval (destructive, outward-facing, or cross-cutting)

| # | Change | Risk / why it needs sign-off |
|---|---|---|
| 1 | **Switch CloudFront origin to private S3 + OAC, turn on Block Public Access, replace the public bucket policy.** | Brief window of misconfiguration risk on the live site; must be done in the right order (create OAC → add OAC bucket policy → switch origin to REST endpoint → wait for deploy → block public access). Fully reversible but user-facing. |
| 2 | **Rename bucket `videverum-site` → `videverum-prod-site`.** | S3 buckets can't be renamed — requires new bucket + `aws s3 sync` + origin swap + CloudFront invalidation. Downtime-free if sequenced, but it's a live-origin change. Alternative: keep the name, just document it. |
| 3 | **Migrate `videverum.com` DNS from Namecheap to a new Route 53 hosted zone.** | Nameserver cutover. Requires recreating all existing records (MX/email, TXT/SPF, any subdomains) in Route 53 first, then changing NS at Namecheap. Propagation delay; email risk if records missed. |
| 4 | **Delete DynamoDB table `vv-incidents`** (after export in 6-G). | Destroys 13 published editorial entries. On-demand so no cost pressure — only delete if you're sure the UFO encyclopedia is not coming back. |
| 5 | **Delete the UFO application code** (`frontend-admin/`, `backend/`, `frontend-public/BACKEND_ADDITIONS.py`, the incident/era/catalog pages, `api.ts` data layer) and rebuild `frontend-public` as a plain corporate site. | Large code change; you may want to keep `frontend-admin`/`backend` in git history or a branch. |
| 6 | **Retire IAM user `rabbithole-deploy` / tighten `quiccloud`.** | Belongs to other products; could break RabbitHole's deploy or your own CLI workflow. RabbitHole owner decision. |
| 7 | **Any change to PureZen, QuicLens, stephsimmons.dev, or RabbitHole resources.** | Explicitly out of scope. Flagged here for the respective owners only. |

---

## 8. Legacy / naming scan results

Searched all resources for `ufo`, `alien`, `disclosure`, `sightings`, `truth`, and
experimental/dev/test names.

- **No resources** named with those tokens.
- The UFO concept survives only as: (a) `videverum-site` bucket **contents** (the SPA build),
  (b) `vv-incidents` table + its 13 entries, (c) the repo's `frontend-admin` / `backend` /
  incident-related frontend code. All identified above.
- `vv-` prefix (`vv-incidents`, and `vv-admin-api` / `vv-lambda-role` referenced in
  `DEPLOY.md` but never created) = the old "Vide Verum app" naming. Only `vv-incidents` actually
  exists.
- "Vide Verum" / "VideVerum" itself = Latin *"see the truth"*, originally the UFO brand, now the
  parent-company name → **keep the name**, it's the company.
- `quiccloud` vs `quiclens`: QuicLens uses **both** prefixes (`quiccloud_*` tables +
  `quiccloud-raw-uploads` bucket + `quiccloud` user, alongside `quiclens_*` tables and
  `QuicLensStack`). Inconsistent but **functional and owned by QuicLens** — not VideVerum's to
  fix. Noted for the QuicLens repo.
- `rabbithole-dev-*`: everything RabbitHole is `-dev-` with no prod counterpart. Functional;
  renaming would destroy/recreate. Left alone.

---

## 9. What I recommend you decide now

1. **Keep bucket name or rename?** (drives whether item 6-B imports `videverum-site` as-is or we
   do the new-bucket dance in 7-2). Recommendation: **rename to `videverum-prod-site`** while we
   have no traffic pressure and the deploy pipeline doesn't exist yet — cleanest long-term.
2. **Route 53 migration: now or later?** Recommendation: **later, as its own change** — audit the
   current Namecheap zone (especially email records) first.
3. **`vv-incidents` + UFO code: archive and delete, or keep dormant?** Recommendation:
   **export → delete table, move `frontend-admin`+`backend` to an `archive/ufo-era` branch,
   rebuild `frontend-public` as the corporate site.**
4. **Scope confirmation:** I will touch **only** VideVerum resources + shared OIDC provider
   (additively). I will **not** modify RabbitHole, QuicLens, PureZen, or stephsimmons.dev — I'll
   only list recommendations for their owners. Confirm that's what you want.

Nothing has been changed. Awaiting your direction on Phase 3+.
