# WILMS v1.7.5 — Final Release Readiness

## Status

Ready for PR review on `feature/v1.7.5-offline-push-modernisation`.

## DoD checklist

- [x] Holiday request lifecycle + SoD tests
- [x] Field-critical offline UX for all roles
- [x] Push triggers + graceful VAPID disable
- [x] Dashboard kit migration
- [x] App Lock + Product Tour updates
- [x] `npm run lint` / `type-check` passed locally
- [x] Focused unit tests passed (holiday lifecycle, app lock, dashboard kit); full frontend shard suite green
- [x] Version artefacts at 1.7.5
- [x] Feature branch pushed; PR opened

## Hard guarantees unchanged

Financial engine, RBAC/SoD, reconciliation, in-app notifications, and scheduler behaviour are extended, not weakened.

## Deploy note

Apply migration `0036_v175_holiday_requests` before enabling holiday request APIs against Neon.
Configure `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` for live Web Push delivery.
