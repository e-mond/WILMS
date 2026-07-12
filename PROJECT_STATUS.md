# WILMS - Project Status

**Last updated:** 2026-07-12 (v1.3.6-rc1)  
**Package version:** `1.3.6`  
**Branch:** `cursor/v136-rc1-production-stabilisation-8847`  
**Production:** v1.3.5 deployed — migrations 0020/0022 pending (health degraded)

---

## Summary

v1.3.6-rc1 is a production stabilisation release candidate. No new features. Fixes duplicate collector PIN settings, production mock guard, health diagnostics, admin collector messaging, and display formatting.

---

## v1.3.6-rc1 scope

| Item | Status |
|------|--------|
| Remove duplicate PIN / App Lock on collector settings | ✅ |
| Redirect `/collector/security` → settings | ✅ |
| Production mock webpack guard | ✅ |
| Health `degradedReasons` diagnostics | ✅ |
| Fix collectors page open messages (id validation) | ✅ |
| Collector aside display id formatting | ✅ |
| Version bump to 1.3.6 | ✅ |
| RC audit reports (13 deliverables) | ✅ |

---

## Production action required

```bash
npm run db:migrate -w @wilms/api
```

Until applied, production `/health` reports `degraded` (22/23 migrations; missing `0020` tables).

---

## Verification (2026-07-12)

| Gate | Result |
|------|--------|
| type-check | PASS |
| lint | PASS |
| backend tests | 108/108 |
| frontend tests | 233/233 |
| build + bundle | PASS |

---

## Next milestone

**v1.4.0 Stable Production Release** — after migrations applied, smoke tests pass, and RC sign-off.
