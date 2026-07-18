# Error Handling Audit — v1.4 UX Modernisation (Delta)

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## Existing strengths (carry-forward)

- Route/friendly error boundaries from v1.3.8 hardening
- Toast dedupe keys
- Request ID propagation (Phase 20)
- BFF sanitisation of upstream errors (prior packs)

## This pack

| Area | Change |
|------|--------|
| Global search empty/loading | Actionable empty copy + skeleton instead of blank/spinner text only |
| Tour dismissal | Deterministic persistence (no setState race) |

## Residual

| ID | Item | Priority |
|----|------|----------|
| ERR-01 | Sweep remaining raw API message surfaces in rare settings panels | P2 |
| ERR-02 | Ensure every dashboard widget isolates query errors | P1 (partially done historically) |

## Policy reminder

Never expose SQL, stack traces, Prisma/Drizzle internals, or internal IDs to end users. Log with request/correlation IDs server-side.
