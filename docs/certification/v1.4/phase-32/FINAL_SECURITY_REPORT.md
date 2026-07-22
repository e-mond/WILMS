# Phase 32 — Final Security Report

**Status:** Code-level PASS | Live staging BLOCKED

## Verified in code/tests

- Scheduler token auth (`WILMS_SCHEDULER_TOKEN`) with timing-safe comparison
- Invalid token → 401; valid token → 200 (HTTP integration test)
- RBAC regression suite in financial harness (11/11)
- SoD self-approval tests across loans, borrowers, reconciliation, adjustments
- Session invalidation, invitation token, password policy tests

## Blocked (requires staging)

- Live RBAC negative matrix across all five roles
- Production configuration secret audit (G10)
- Demo user purge query on production DB (G11)
- Security sign-off (G15-S)

## Residual risk

Operator gates blocked — deployed-environment authZ not re-verified in this phase.
