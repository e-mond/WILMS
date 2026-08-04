# WILMS Release Notes — v1.4.3

**Critical financial workflow hotfix**

## Highlights

- Loan disbursement UI now follows the real approval lifecycle (approve → pending disbursement → disburse).
- All browser financial mutations send an `Idempotency-Key` automatically (including reconciliation submit).
- Approver review shows borrower group as `GRP-… — Name` (never raw UUIDs).
- Admin fee recording notifies the borrower by SMS/email and logs an audit entry (no duplicate SMS).
- Friendlier financial error messages; network errors offer Retry, Refresh, and Return to Dashboard.

## Who is affected

Collectors, Approvers, Super Admins performing disbursement, reconciliation, payments, and admin-fee recording.

## Upgrade notes

- No new database migrations.
- Ensure production continues to set `WILMS_FLAG_REQUIRE_IDEMPOTENCY=true` (default with DB).
- SMS/email for admin fee requires configured providers and enabled notification settings.
