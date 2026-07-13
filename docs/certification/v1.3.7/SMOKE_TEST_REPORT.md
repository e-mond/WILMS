# Smoke Test Report — v1.3.7

**Date:** 2026-07-13 (remediation sprint)  
**Environment:** Production

---

## Credential policy (updated)

Production smoke **no longer falls back to demo accounts** on `wilms.vercel.app`. Set:

```bash
WILMS_SMOKE_EMAIL=<production-super-admin>
WILMS_SMOKE_PASSWORD=<secret>
```

Without these, smoke exits immediately with a clear error (verified 2026-07-13).

---

## Prior automated run (pre-remediation)

**14/33 PASS** when demo credentials were attempted — auth failed with HTTP 401.

Infrastructure checks passed: CSRF, public photo-capture routes, unauthenticated API 401.

---

## Health gate (updated)

`api-health-status` now requires `status=ok` (not `degraded`).

---

## Expanded route coverage (remediation)

Added smoke probes for:

- `/expenses`
- `/reconciliations`
- `/notifications/inbox`
- `/audit-log`
- `/search?q=test`

---

## RBAC smoke

Requires per-role env vars on production:

| Role | Email env | Password env |
|------|-----------|--------------|
| Admin | `WILMS_SMOKE_EMAIL` | `WILMS_SMOKE_PASSWORD` |
| Collector | `WILMS_SMOKE_COLLECTOR_EMAIL` | `WILMS_SMOKE_COLLECTOR_PASSWORD` |
| Officer | `WILMS_SMOKE_OFFICER_EMAIL` | `WILMS_SMOKE_OFFICER_PASSWORD` |

**Status:** **BLOCKED** — credentials not available in agent environment.

---

## Manual workflow smoke

All manual workflows remain **BLOCKED** until authenticated production access is provided.

---

## Verdict

**NOT PASS** — awaiting migration remediation deploy + production credentials.
