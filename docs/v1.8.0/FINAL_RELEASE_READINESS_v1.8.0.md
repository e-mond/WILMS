# WILMS v1.8.0 — Final Release Readiness

## Status

**Production readiness closure** on `fix/v1.8.0-production-readiness` (identity **1.8.0**, no retag).  
Base: `origin/main` after PR #175.  
Authoritative matrix: [`PRODUCTION_READINESS_MATRIX.md`](./PRODUCTION_READINESS_MATRIX.md).

## Verdict

**READY WITH CONDITIONS** — local gates + targeted regressions pass; production SHA smoke and Playwright a11y not fully evidenced in the closure environment.

## DoD

- [x] CSP font errors eliminated (self-hosted `next/font`; live CSP `font-src 'self' data:`)
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
- [x] Post-release UI update (#175) + production-readiness closure (ShellNavIcon, Drawer, selective stack tables, upload UX, README 1.8.0)
- [ ] Apply migrations **0037–0039** on Neon (operator script: `scripts/apply-v180-migrations.sh`) — operator responsibility if not already applied
- [ ] Staging / production smoke with `WILMS_APP_URL` + optional VAPID
- [ ] Confirm Vercel Production deploy SHA matches intended release commit

## Deploy

```bash
./scripts/apply-v180-migrations.sh
# optional cron
# POST /api/v1/automation/scheduler/run
WILMS_APP_URL=https://wilms.vercel.app npm run smoke:production
```

## Rollback

Redeploy previous release artifact; restore Neon backup if schema must be reverted. Additive migrations prefer forward-fix.
