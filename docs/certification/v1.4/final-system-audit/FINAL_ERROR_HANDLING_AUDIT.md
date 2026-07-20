# Final Error Handling Audit — WILMS v1.4.1

**Date:** 2026-07-20  
**Primary change this branch:** API unhandled-error disclosure hardening

---

## Verified fix

| Behaviour | Before (risk) | After | Evidence |
|-----------|---------------|-------|----------|
| Unhandled `Error` | Client could see raw `Error.message` (SQL/paths/secrets leakage) | Generic: “An unexpected error occurred. Please try again.”; detail logged server-side | `apps/backend/src/http/error-handler.ts` — **Verified** |
| `AppError` | Structured status/code/message to client | Unchanged (intentional) | Same file |
| Mapped DB validation | 422 with mapped message | Unchanged | `mapDatabaseError` |

Tests: `apps/backend/src/tests/http/error-handler.test.ts`.

---

## Other error / fail-closed behaviours (this branch)

| Path | Behaviour | Status |
|------|-----------|--------|
| Money reports over row safety limit | HTTP **422** + explicit understatement message | **Verified** |
| Demo login in production | Blocked (`DEMO_LOGIN_BLOCKED` → mapped auth failure path) | **Verified** |
| Inactive / revoked session on `/auth/session` | Unauthenticated | **Verified** |
| Collector payment GET without assignment | Denied / not found per route policy | **Verified** |

---

## Frontend / BFF

| Topic | Status |
|-------|--------|
| BFF CSRF failures | Existing pattern — user must retry via browser session |
| Toast dedupe | Prior UX pack |
| Network / offline queue errors | Field ops docs; not re-audited here |

---

## Residuals

| Item | Notes |
|------|-------|
| Some validation paths still slice `VALIDATION:` prefixes ad hoc | Consistent enough; consolidate later |
| Unwired `notify*` templates | Failed notification paths may be silent — residual |
| Operator runbook for 422 report refusals | See [TROUBLESHOOTING.md](../../../TROUBLESHOOTING.md) |

---

## Explicit non-claims

- No claim of perfect error taxonomy across every module.  
- No live production error-rate SLO evidence in this pack.
