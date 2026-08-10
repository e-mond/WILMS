# Phase 33 — Insider Threat Report

**Identity:** WILMS v1.8.0  
**Scope:** Role/permission matrices + SoD self-approve suites (local)

## Method

- RBAC source: `@wilms/shared-rbac` role permissions
- Existing adversarial SoD suites: loans, borrowers, adjustments, reconciliation, overpayment, sync conflict
- Hypotheses H6 (offline conflict SoD) and H9 (maker-checker residual)

## Results

| Area | Result |
|------|--------|
| Loan self-approve | Blocked (existing suite) |
| Borrower self-approve | Blocked |
| Adjustment self-approve | Blocked |
| Reconciliation self-review | Blocked |
| Overpayment self-resolve | Blocked |
| Sync conflict self-approve | Blocked |
| Expense self-approve | Review requires `MANAGE_EXPENSES`; recorder uses `RECORD_EXPENSES` — no new bypass found |
| Payment reversal SoD | Existing reversal flow + idempotency; no new actor bypass proven this phase |

## Findings

| ID | Severity | Status | Summary |
|----|----------|--------|---------|
| H6 | Info | Residual | Offline queue integrity relies on server SoD + conflict workflow; extend harness if new conflict types ship |
| H9 | Info | Residual | No confirmed SoD gap beyond previously remediated suites |

## Verdict (insider)

No new Critical/High insider SoD bypass confirmed in Phase 33. Privilege abuse residual remains environment/ops dependent (credential sharing, over-privileged accounts).
