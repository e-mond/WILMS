# WILMS Troubleshooting — v1.4.1

**Date:** 2026-07-20  
**Related:** [PRODUCTION_ROLLOUT_RUNBOOK.md](./PRODUCTION_ROLLOUT_RUNBOOK.md), [FINAL_AUDIT_INDEX.md](./FINAL_AUDIT_INDEX.md)

---

## Health and migrations

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `/health` degraded, migrations behind | Deploy image ahead of applied migrations or failed migrate | Run migrate; confirm journal watermark; do not ignore soft-fail |
| `/health` ok but features missing | Wrong environment / old frontend | Check version strings FE + API |
| DB unknown | `DATABASE_URL` missing or query failure | Fix connection; in-memory is not production |

---

## Authentication

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `@wilms.demo` login fails in production | **Expected** — demo blocked | Use real staff accounts |
| Session endpoint returns unauthenticated | Revoked/suspended user or inactive session | Re-login; check user status |
| CSRF errors via browser BFF | Missing/invalid CSRF cookie | Use UI flows; avoid raw curl to `:3000/api/wilms` |

---

## Payments and collectors

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Collector cannot open payment-entry / same-day / payment-by-id | Borrower not assigned (IDOR guard) | Assign borrower or use privileged role |
| Admin fee status denied for collector | Scope guard | Confirm assignment |

---

## Money reports

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| HTTP **422** on daily-collection / defaulters / financial-ledger | Result set would exceed safety cap (2000) — fail closed | Narrow date range / filters; do not bypass |
| Totals look “too small” historically | Pre-fix truncation risk | Prefer post-fix builds; use SQL KPI dashboard for org totals |

---

## API errors

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Generic “unexpected error” to client | Unhandled server error (message hidden by design) | Inspect API logs / stack — raw message is server-side only |
| 422 validation | Mapped DB / AppError validation | Fix payload |

---

## Deploy / Node

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Staging workflow skipped | `ENABLE_STAGING_DEPLOY` not true | Set deliberately |
| Engine mismatch | Node < 22 | Align to Node 22 everywhere |

---

## Escalation

1. Capture `/health` JSON, request id, timestamp, environment.  
2. Do not seed demo users into production.  
3. For financial disputes, freeze affected workflows and engage Finance with ledger exports.
