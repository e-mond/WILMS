# RC1.3.2 — Console Audit

**Date:** 2026-07-02T22:45:00Z  
**Method:** Classification from RC1.1/RC1.2 audits + production API failure mode; **live browser sweep not executed** (API 500s prevent meaningful page load)

---

## Summary

**Result: INCOMPLETE (live)** — Application defects expected on all list pages due to HTTP 500. Extension noise documented as non-defects.

---

## Expected application console (production today)

| Symptom | Classification | Severity |
|---------|----------------|----------|
| Failed fetch to `/api/wilms/dashboard/summary` | **Application defect** | P0 |
| Failed fetch to `/api/wilms/borrowers` | **Application defect** | P0 |
| Failed fetch to `/api/wilms/groups`, `/collectors`, etc. | **Application defect** | P0 |
| React Query error state on list panels | **Expected UX** until API fixed | — |
| `ERR_CONTENT_DECODING_FAILED` | **Not observed** in smoke (500 before decode issue) | — |
| Chunk load failure | **Not observed** | — |
| Hydration mismatch | **Not observed** in prior RC1.2 partial E2E | Monitor |

---

## Non-defects (ignore)

| Source | Examples |
|--------|----------|
| Browser extensions | `background.js`, `installHook.js`, message channel closed |
| Network transient | `ERR_NAME_NOT_RESOLVED`, `ERR_NETWORK_CHANGED` |
| PWA | `beforeinstallprompt` informational |
| Railway cold start | `checkId` timeout (RC1.1 documented) |

Reference: `docs/page-validation/RC1.1-console-classification.md`

---

## RC1.3 empty-state UX

Intelligent empty/error differentiation (avoid "check your connection" on empty data) is on **`release/rc1-3-final-certification`**, **not deployed** on current production (`cf3ce10` / pre-RC1.3).

---

## Pass gate

Zero application console errors on all pages: **FAIL** (blocked by API 500s). Re-run after production recovery.
