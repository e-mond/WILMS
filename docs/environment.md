# Environment variables

**Purpose:** Single reference for configuration used by WILMS v1.5.  
**Sources verified:** `packages/domain/src/config/env.ts`, `validate-env.ts`, upload validation, `apps/frontend/.env.example`, root `.env.example`, Cron route auth.

Never commit real secrets. Use Vercel Preview/Production env settings for deployed environments.

---

## Frontend (Next.js)

| Name | Required | Purpose | Example / notes |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Recommended | Public site URL | `https://wilms.vercel.app` |
| `NEXT_PUBLIC_API_BASE_URL` | Yes (live mode) | Browser API prefix | `/api/wilms` |
| `NEXT_PUBLIC_USE_MOCK` | Yes for live | Disable mock provider | `false` |
| `NEXT_PUBLIC_WILMS_ENV` | Optional | Env label | `production` / `development` |
| `NEXT_PUBLIC_APP_LOCK_IDLE_MS` | Optional | App lock idle timeout | `300000` |
| `NEXT_PUBLIC_DEMO_MODE` | Dev only | Force demo UI paths | leave unset in production |
| `NEXT_PUBLIC_FORCE_DEMO_MODE` | Dev only | Force demo | leave unset in production |
| `NEXT_PUBLIC_API_DISABLED` | Dev only | Force mock | leave unset in production |

### Dual-run only

| Name | Required | Purpose |
|---|---|---|
| `WILMS_API_MODE` | Optional | Set to `proxy` to forward `/api/wilms` to an upstream Node API |
| `WILMS_API_UPSTREAM` | If proxy | Upstream base URL (e.g. `http://127.0.0.1:4000`) |

---

## Domain / database / security

| Name | Required (prod serverless) | Purpose | Security |
|---|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres URL — use **pooled** endpoint on Vercel | Secret |
| `WILMS_SESSION_SECRET` | Yes | HMAC key for session tokens | Secret; rotate carefully |
| `REDIS_URL` or `WILMS_REDIS_URL` | Yes (serverless prod) | Shared rate-limit store | Secret |
| `WILMS_SCHEDULER_TOKEN` | Yes for manual/API schedulers | Bearer for `POST /notifications/scheduler/run` | Secret |
| `CRON_SECRET` | **Required on Vercel Production** | Bearer Vercel Cron sends to `GET /api/cron/notifications` | Secret |
| `WILMS_METRICS_TOKEN` | Optional | Bearer for Prometheus scrape of metrics | Secret |
| `WILMS_CORS_ORIGIN` | Required for standalone Node process; not required for pure serverless same-origin | CORS allowlist | — |
| `WILMS_APP_URL` | Optional | Canonical app URL for links | — |
| `WILMS_API_PORT` / `PORT` | Optional | Listen port for Node adapter | default `4000` |
| `WILMS_API_HOST` | Optional | Listen host | — |
| `WILMS_TRUST_PROXY` | Optional | Express trust proxy | — |
| `WILMS_TRUST_PROXY_HOPS` | Optional | Proxy hop count | default `1` |
| `WILMS_MIN_GROUP_SIZE` / `WILMS_MAX_GROUP_SIZE` | Optional | Group size bounds | defaults 5 / 15 |
| `WILMS_UPLOAD_DIR` | Optional | Local upload dir | — |
| `WILMS_QUEUE_PREFIX` | Optional | BullMQ prefix | default `wilms` |
| `WILMS_RUNTIME` | Optional | `serverless` forces no workers | auto on Vercel |
| `WILMS_GIT_COMMIT` | Optional | Manual commit label for health | Prefer platform SHA |
| `VERCEL_GIT_COMMIT_SHA` | Injected | Commit in health | — |
| `RAILWAY_GIT_COMMIT_SHA` | Injected if ever on Railway dual-run | Commit in health | — |
| `NEXT_PHASE` | Injected by Next build | Allows build-time session placeholder | — |

---

## Uploads

| Name | Required | Purpose |
|---|---|---|
| `UPLOAD_PROVIDER` | Prod: `cloudinary` typical | `local` or `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | If Cloudinary | Upload credentials |
| `CLOUDINARY_FOLDER` | Optional | Folder prefix |
| `UPLOAD_MAX_SIZE_BYTES` | Optional | Max upload size |
| `UPLOAD_ALLOWED_MIME_TYPES` | Optional | Allowlist |

---

## Mail / SMS

| Name | Purpose |
|---|---|
| `MAIL_PROVIDER` | `none`, `gmail`, etc. |
| `MAIL_FROM` | From address |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Gmail SMTP |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_SECURE` | Generic SMTP |
| `RESEND_API_KEY` | Resend provider if configured |
| `WILMS_INTERNAL_MAIL_SECRET` | Internal mail relay auth when used |
| `SMS_PROVIDER` | `none`, `smsnotifygh`, etc. |
| `SMSNOTIFYGH_API_KEY` / `SENDER_ID` / `API_URL` / `BALANCE_URL` | SMSNotifyGH |
| `ARKESEL_*` / `TWILIO_*` | Alternate SMS providers if configured |

Exact provider activation is determined by domain mail/SMS modules—set only what your environment uses.

---

## E2E / Playwright

`FRONTEND_PORT`, `PLAYWRIGHT_HOST`, `PLAYWRIGHT_PORT`, `PLAYWRIGHT_BASE_URL`, `E2E_HOST`, `E2E_PORT` — local test runners only.

---

## Production checklist (Vercel)

Preview and Production must each define at least:

1. `DATABASE_URL` (pooled)  
2. `WILMS_SESSION_SECRET`  
3. `REDIS_URL` or `WILMS_REDIS_URL`  
4. `NEXT_PUBLIC_API_BASE_URL=/api/wilms`  
5. `NEXT_PUBLIC_USE_MOCK=false`  
6. `WILMS_SCHEDULER_TOKEN` and/or `CRON_SECRET`  
7. Mail/SMS/upload secrets as required by your providers  

See also [`v1.5/VERCEL_DEPLOYMENT_REPORT.md`](v1.5/VERCEL_DEPLOYMENT_REPORT.md).
