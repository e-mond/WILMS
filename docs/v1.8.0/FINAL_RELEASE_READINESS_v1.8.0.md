# WILMS v1.8.0 — Final Release Readiness

## Status

Release candidate on `feature/v1.8-enterprise-design-automation`.

## DoD

- [x] CSP font errors eliminated (self-hosted `next/font`)
- [x] Holiday API hardened + enrichment (notes/evidence/community) + cancel + impact preview
- [x] Ghana public holidays sync
- [x] Single premium holiday calendar UX
- [x] Unique dashboard icons
- [x] iOS-inspired surfaces + role workspace heroes
- [x] Offline SW expansion + sync progress panel
- [x] Automation engine + Settings admin (list/enable/run) + follow-up/executive alerts
- [x] Quiet hours + inbox category filters
- [x] Product Tour updates (automation/offline/push/app lock)
- [x] Documentation pack under `docs/v1.8.0/` including security/migration/offline architecture/test evidence
- [ ] Apply migrations **0037–0039** on Neon (operator script: `scripts/apply-v180-migrations.sh`)
- [ ] Staging validation with production-like `DATABASE_URL` + optional VAPID

## Deploy

```bash
./scripts/apply-v180-migrations.sh
# optional cron
# POST /api/v1/automation/scheduler/run
```

## Rollback

Redeploy previous release artifact; restore Neon backup if schema must be reverted. Additive migrations prefer forward-fix.
