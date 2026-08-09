# WILMS v1.8.0 — Release Readiness Report

See also: `FINAL_RELEASE_READINESS_v1.8.0.md`.

## Verdict

**Release candidate ready for staging validation** on branch `feature/v1.8-enterprise-design-automation`, contingent on:

1. Applying migrations 0037–0039 on Neon
2. CI green for lint / type-check / tests / build
3. Operator confirmation of VAPID keys (optional push) and DATABASE_URL

## Implemented

- CSP-safe self-hosted fonts
- Holiday API hardening + enrichment + impact preview + cancel
- Ghana holiday provider + Settings sync
- Premium holiday calendar UX
- Unique icon system + iOS-inspired shell/role workspaces
- Offline shell expansion + sync progress UX
- Automation rules/tasks/enable + daily pass follow-ups/executive alerts
- Quiet hours + expanded notification inbox filters
- Product Tour 3.0 coverage for automation/offline/push/app lock (role-aware)
- Documentation pack under `docs/v1.8.0/`

## Known residuals (documented, not blockers for RC)

- Durable offline writes still focused on payments/expenses/holidays
- Executive pack delivery notifies executives to export from Executive Intelligence (full server-side PDF email fan-out remains iterative)
- Visual workflow rule builder UI not included (enable/disable + seed rules shipped)
- App Lock WebAuthn is device-local
- Official `documentation/` PDF library regeneration requires `npm run docs:prepare` with generator VERSION 1.8.0
