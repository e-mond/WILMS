# FINAL_INFRASTRUCTURE_AUDIT.md

**Release candidate:** v1.3.8  
**Date:** 2026-07-17

## Live Production Snapshot

Source: `GET https://wilms-production.up.railway.app/health`

| Field | Value |
|---|---|
| status | `ok` |
| version | **1.3.7** (not yet 1.3.8) |
| gitCommit | `64c3dbb…` |
| database | connected |
| schema.status | `ok` |
| migrations.status | `ok` (applied 26 / expected 27 watermark) |
| uploads | cloudinary valid |
| mail | gmail configured |
| sms | smsnotifygh configured |
| redis | not_used |
| queue | in_process |
| scheduler | http_triggered |

App: `https://wilms.vercel.app` → HTTP 307 (healthy redirect)

## Dependency Matrix

| Dependency | Status | Evidence |
|---|---|---|
| Railway API | ✅ Healthy | `/health` |
| Vercel frontend | ✅ Reachable | 307 |
| Neon Postgres | ✅ Connected | health.database |
| Cloudinary | ✅ Configured | health.uploads |
| Gmail SMTP | ✅ Configured | health.integrations.mail |
| SMS | ✅ Configured | health.integrations.sms |
| Redis | N/A by design | not_used |
| Push notifications | Optional | health.notifications.push |
| Backups / DR drill | ⛔ Unverified | Operator |
| Monitoring / alerting | ⛔ Unverified | Operator |
| Authenticated smoke | ⛔ Blocked | Needs `WILMS_SMOKE_*` |

## Required Operator Actions

1. Deploy v1.3.8 to Railway + Vercel.
2. Confirm `MAIL_WEBHOOK_SECRET` / `RESEND_WEBHOOK_SECRET` set if webhooks used.
3. Run `smoke:production` + `smoke:rbac` with live credentials.
4. Confirm Neon PITR / backup policy.
5. Confirm alerting on `/health` degraded transitions.

## Verdict

**Infrastructure gate: CONDITIONAL PASS** for platform health of current prod; **FAIL for v1.3.8 deploy sync** until candidate is released.
