# Final Release Summary — v1.3.7 Production Certification

**Date:** 2026-07-13 (remediation sprint)  
**Stable tag:** [`v1.3.7`](https://github.com/e-mond/WILMS/releases/tag/v1.3.7)  
**Production certified tag:** **NOT ISSUED**

---

## Status

| Layer | State |
|-------|-------|
| Application code | **Stable** — 366 unit tests pass |
| Migration journal | **Fixed** — 27 entries (`0000`–`0026`) |
| Live production DB | **Degraded** — pending operator deploy + migrate |
| Certification | **NOT COMPLETE** |

---

## What changed in remediation sprint

1. **`0026_v137_prod_schema_repair`** — recreates missing `0020` tables/enums idempotently
2. **`npm run verify:migrations`** — journal/SQL parity + optional DB state check
3. **Health endpoint** — reports mail/SMS integration status and worker model (no Redis)
4. **Smoke scripts** — refuse demo credentials on `wilms.vercel.app`; require `status=ok`
5. **Documentation** — [REMEDIATION_RUNBOOK.md](./REMEDIATION_RUNBOOK.md) for operators

---

## Operator checklist (remaining)

- [ ] Merge remediation PR to `main`
- [ ] `pg_dump` production database
- [ ] Railway redeploy (auto-migrates via `start:prod`)
- [ ] Confirm `/health` → `ok`, `migrations.applied: 27`
- [ ] Run `smoke:production` with `WILMS_SMOKE_EMAIL` / `WILMS_SMOKE_PASSWORD`
- [ ] Run `smoke:rbac` with per-role credentials
- [ ] Live financial reconciliation with `verify:financial`
- [ ] Backup restore drill on Neon branch
- [ ] Browser / mobile / WCAG / Lighthouse audits
- [ ] Tag `v1.3.7-production-certified` + update GitHub Release

---

## Blocked validations (honest)

| Validation | Blocker |
|------------|---------|
| Production migrate | No `DATABASE_URL` in agent |
| Smoke / RBAC | No production user passwords |
| Backup / restore | No Neon console |
| Financial live audit | No DB access |
| Browser / mobile / a11y | No real devices / browser automation |

---

## Recommendation

**Hold go-live.** Merge remediation PR, apply migrations on production, re-run smoke with real credentials, then complete manual certification checklist before tagging `v1.3.7-production-certified`.
