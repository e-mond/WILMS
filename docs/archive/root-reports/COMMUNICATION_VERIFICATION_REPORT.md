# Communication Verification Report — v1.2.1

**Date:** 2026-07-07

## v1.2.0 features verified (no regressions)

| Feature | Status | Notes |
|---------|--------|-------|
| Rich text composer | ✅ | Communication Center compose modal |
| Attachments | ✅ | Upload/preview/replace/delete |
| Password reset | ✅ | `/forgot-password`, `/reset-password` |
| Push notifications | ✅ | SW + VAPID endpoints + preferences |
| Email open tracking | ✅ | Pixel via `/api/t/o` |
| Email click tracking | ✅ | Links via `/api/t/c` |
| Provider webhooks | ✅ | Resend + generic receivers |
| Analytics dashboard | ✅ | Time series, CTR, top lists |
| Scheduler | ✅ | Scheduled + recurring + retry |
| Template builder | ✅ | Variables, preview, versions |
| User preferences | ✅ | Settings panel + delivery gates |
| Invitation flow | ✅ | Fixed in v1.2.1 |

## Invitation-specific hardening

- Transactional emails use `enableTracking: false`
- Delivery logging is best-effort (does not fail sends)
- Meaningful API errors for all failure modes

## Test results

- `npm run type-check` — PASS
- `npm run test -w @wilms/api` — 65/65
- `npm run test -w @wilms/frontend` — 223/223
- `npm run smoke:production` — 31/31
- `npm run smoke:rbac` — 11/11
