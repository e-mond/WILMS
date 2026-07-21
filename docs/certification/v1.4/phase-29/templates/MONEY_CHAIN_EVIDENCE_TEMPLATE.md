# Money-Chain Evidence Template

**Version:** 1.4.2  
Copy this template when executing staging money-chain smoke. Attach completed file to certification evidence.

## Run metadata

| Field | Value |
|-------|-------|
| Environment | staging |
| Operator | |
| Date (UTC) | |
| STAGING_API_URL | (redact in stored evidence if required) |

## Chain steps

| Step | Actor (role) | Entity ID | Amount (pesewas) | Expected state | Actual state | Audit log ID | Pass/Fail |
|------|--------------|-----------|------------------|----------------|--------------|--------------|-----------|
| 1. Register borrower | Registration Officer | | — | PENDING | | | |
| 2. Approve borrower | Approver (≠ officer) | | — | APPROVED | | | |
| 3. Create group | Super Admin | | — | ACTIVE | | | |
| 4. Create loan | Officer | | | PENDING_APPROVAL | | | |
| 5. Admin fee | Officer | | | RECORDED | | | |
| 6. Approve loan | Approver (≠ creator) | | | PENDING_DISBURSEMENT | | | |
| 7. Disburse | Super Admin | | | ACTIVE | | | |
| 8. Record collection | Collector | | | CONFIRMED | | | |
| 9. Reverse payment | Super Admin | | | REVERSED | | | |
| 10. Submit expense | Collector | | | PENDING | | | |
| 11. Approve expense | Super Admin (≠ collector) | | | APPROVED | | | |
| 12. Reconciliation | Collector + reviewer | | | APPROVED | | | |
| 13. Dashboard totals | Auditor | | — | matches SQL | | | |
| 14. Report totals | Auditor | | — | matches dashboard | | | |

## Reconciliation check

| Metric | Expected (SQL) | Dashboard | Reports | Match? |
|--------|----------------|-----------|---------|--------|
| Pool capital | | | | |
| Disbursed | | | | |
| Collected | | | | |
| Outstanding | | | | |
| Operating cash | | | | |
| Expenses (approved) | | | | |

## Sign-off

- [ ] Finance reviewer: totals reconcile
- [ ] Operator: evidence attached
