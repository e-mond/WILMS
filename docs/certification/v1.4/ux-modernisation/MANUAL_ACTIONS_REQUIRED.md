# Manual Actions Required

**Date:** 2026-07-18  
**Author:** WILMS Engineering

These are **not** code defects. They require operator or human QA action.

1. Provide production Super Admin credentials via `WILMS_SMOKE_EMAIL` / `WILMS_SMOKE_PASSWORD` (never demo accounts).
2. Confirm `WILMS_APP_URL` and `WILMS_API_URL` for smoke.
3. Provide Postgres `DATABASE_URL` (not Neon Data API REST) for backup/restore drill and financial validate.
4. After deploy of this UX branch: visual QA of header/nav on desktop + tablet + collector mobile.
5. Confirm guided tour welcome appears once for a new user and respects “Don’t Show This Again”.
6. Optional: set `REDIS_URL` / `WILMS_METRICS_TOKEN` for queue/metrics hardening.
7. Run `npm audit` in CI or release checklist and triage highs.
