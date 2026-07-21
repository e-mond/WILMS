# WILMS Environment Variables

**Version:** 1.4.2  
**Last updated:** 2026-07-21

This table documents production-relevant environment variables. Never commit secret values to Git.

| Variable | Required | Environment | Secret | Purpose | Validation | Failure behaviour |
| -------- | -------- | ----------- | ------ | ------- | ---------- | ----------------- |
| `DATABASE_URL` | Production | API | Yes | PostgreSQL connection | Valid Postgres URL with SSL | API fails startup / health degraded |
| `WILMS_SESSION_SECRET` | Production | API | Yes | Session signing | ≥ 64 random chars | Process throws on startup |
| `WILMS_CORS_ORIGIN` | Production | API | No | Allowed browser origin | Valid URL | CORS blocks frontend |
| `WILMS_APP_URL` | Production | API + FE | No | Public app URL for links/redirects | Valid HTTPS URL | Email links may break |
| `REDIS_URL` | Recommended (multi-instance) | API | Yes | BullMQ + distributed rate limits | Valid Redis URL | Falls back to in-process queue |
| `WILMS_TRUST_PROXY` | Production (behind proxy) | API | No | Express trust proxy | `true`/`false` | Incorrect client IP in logs |
| `WILMS_METRICS_TOKEN` | Production | API | Yes | Protect `/ops/metrics` | Random string | Metrics endpoint 401 |
| `WILMS_SCHEDULER_TOKEN` | Recommended (cron) | API | Yes | Authenticate HTTP cron for notification/comms schedulers | ≥ 32 random chars | Cron falls back to session+RBAC only |
| `CLOUDINARY_URL` | If uploads used | API | Yes | File storage | Cloudinary URL format | Upload routes 404 |
| `SMTP_*` / mail provider | If email enabled | API/FE | Yes | Outbound mail | Provider-specific | Mail queued/fails logged |
| `SMS_*` | If SMS enabled | API | Yes | Outbound SMS | Provider-specific | SMS fails logged |
| `NEXT_PUBLIC_API_BASE_URL` | Production FE | Frontend | No | BFF proxy prefix | `/api/wilms` | API calls fail |
| `NEXT_PUBLIC_USE_MOCK` | Never in prod | Frontend | No | Mock data mode | Must be `false` | Mock data shown |
| `WILMS_ENABLE_DEMO_AUTH` | Never in prod | API | No | Allow demo seed users | Must be unset/false | Demo accounts may exist |
| `ALLOW_DEMO_SEED` | Never in prod | API | No | Seed demo users | Must be unset/false | Demo users in DB |

## Frontend local development

Create `apps/frontend/.env.local` (gitignored):

```bash
NEXT_PUBLIC_API_BASE_URL=/api/wilms
NEXT_PUBLIC_USE_MOCK=false
WILMS_API_UPSTREAM=http://127.0.0.1:4000
```

## Staging operator gates

See `scripts/operator/run-staging-gates.sh` for required `STAGING_*` variables.

## Backup / restore drill

```bash
WILMS_BACKUP_DATABASE_URL=... WILMS_RESTORE_DATABASE_URL=... npm run drill:backup-restore
```

Never point restore URL at production.

## Payment notification scheduler (Phase 30 / 31)

Set `WILMS_SCHEDULER_TOKEN` on the API and in the cron runner (GitHub Actions secrets or external cron).

```bash
# Manual / external cron
curl -X POST "$WILMS_API_BASE_URL/notifications/scheduler/run" \
  -H "Authorization: Bearer $WILMS_SCHEDULER_TOKEN" \
  -H "Content-Type: application/json"

# Operator evidence helper
bash scripts/operator/run-notification-scheduler.sh
```

GitHub Actions workflow (optional): `.github/workflows/notification-scheduler.yml`  
Requires secrets `WILMS_API_BASE_URL` and `WILMS_SCHEDULER_TOKEN`.

Mail: `MAIL_PROVIDER`, `RESEND_API_KEY`, or SMTP / `WILMS_VERCEL_MAIL_URL` + `WILMS_INTERNAL_MAIL_SECRET`.  
SMS: provider env vars per `apps/backend/src/infrastructure/sms/` (Arkesel, Twilio, SMSNotifyGH).

Delivery is **best-effort** after financial commit — provider accepted ≠ guaranteed delivery.
