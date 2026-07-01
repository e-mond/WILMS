# RC1.1 — Production Verification

**Date:** 2026-07-01  
**Hotfix commit:** `8e0df23`  
**Deploy:** Railway (`railway up`) + Vercel (`vercel --prod` from `main`)

---

## Pre-deploy local gates

| Gate | Result |
|------|--------|
| `npm run type-check` | PASS |
| `npm run lint` | PASS |
| `npm run verify:api-integrity` | 132/132 PASS |
| `npm run verify:api-coverage` | 0 placeholders PASS |
| `npm run test -w @wilms/api` | 40/40 PASS |
| `npm run build` | PASS |
| `npm run bundle:budget-check` | PASS |

---

## Production smoke (`npm run smoke:production`)

**Target:** `https://wilms.vercel.app` → `https://wilms-production.up.railway.app`

| Check | Result |
|-------|--------|
| API health | 200, DB connected |
| Migrations | 11/11 |
| CSRF + login | PASS |
| BFF proxy (loans, reports, settings, dashboard, groups, pools, risk-flags, messages, collectors) | **24/24 PASS** |

---

## Collector portal smoke (hotfix-specific)

| Flow | Account | Result |
|------|---------|--------|
| Login | `collector@wilms.demo` | 200 |
| Own dashboard | COLLECTOR | **200** |
| Notifications unread count | COLLECTOR | **200** |
| Reconciliation | COLLECTOR | **200** (`GET /reconciliation`) |
| Other collector dashboard | REGISTRATION_OFFICER | **403** (expected) |

---

## Railway health snapshot

```json
{
  "status": "ok",
  "version": "0.2.2",
  "migrations": { "expected": 11, "applied": 11, "status": "ok" },
  "database": { "connected": true }
}
```

---

## Manual checklist

- [x] Collector dashboard loads with real data
- [x] Admin-fee queue without disbursement-eligibility 403
- [x] Notifications badge returns 200
- [x] Registration officer correctly blocked from collector routes
- [ ] Registration upload flow (officer account — verify in browser post-deploy)

---

## Verdict

**PRODUCTION GREEN** — Hotfix deployed and verified via automated smoke + collector RBAC probes.
