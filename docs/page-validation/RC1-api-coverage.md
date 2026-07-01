# RC1 API Coverage

**Generated:** 2026-07-01

## Summary

| Metric | Count |
|--------|-------|
| Next.js pages | 46 |
| Placeholder UI hits | 0 |
| API integrity | PASS |

## Placeholder scan

No placeholder strings detected in production frontend code.

## Page inventory

| Page route |
|------------|
| `/(approver)/approver/pending` |
| `/(approver)/approver/pending/[id]` |
| `/(approver)/approver/reviewed` |
| `/(approver)/approver/settings` |
| `/(auditor)/auditor/audit-log` |
| `/(auditor)/auditor/reports` |
| `/(auditor)/auditor/settings` |
| `/(auth)/login` |
| `/(auth)/session-expired` |
| `/(collector)/collector/admin-fee` |
| `/(collector)/collector/admin-fee/[borrowerId]` |
| `/(collector)/collector/dashboard` |
| `/(collector)/collector/expenses` |
| `/(collector)/collector/groups/[id]/collection-sheet` |
| `/(collector)/collector/my-borrowers` |
| `/(collector)/collector/payment/[id]` |
| `/(collector)/collector/reconciliation` |
| `/(collector)/collector/security` |
| `/(collector)/collector/settings` |
| `/(registration-officer)/officer/my-registrations` |
| `/(registration-officer)/officer/register` |
| `/(registration-officer)/officer/settings` |
| `/(super-admin)/adjustments` |
| `/(super-admin)/borrowers` |
| `/(super-admin)/borrowers/[id]` |
| `/(super-admin)/borrowers/[id]/loan` |
| `/(super-admin)/collectors` |
| `/(super-admin)/collectors/[id]` |
| `/(super-admin)/dashboard` |
| `/(super-admin)/groups` |
| `/(super-admin)/groups/[id]` |
| `/(super-admin)/loan-pools` |
| `/(super-admin)/loans` |
| `/(super-admin)/loans/[id]` |
| `/(super-admin)/loans/new` |
| `/(super-admin)/reports` |
| `/(super-admin)/reports/audit-log` |
| `/(super-admin)/reports/collector-performance` |
| `/(super-admin)/reports/daily-collection` |
| `/(super-admin)/reports/defaulters` |
| `/(super-admin)/reports/financial-ledger` |
| `/(super-admin)/reports/group-risk` |
| `/(super-admin)/reports/loan-portfolio` |
| `/(super-admin)/risk-flags` |
| `/(super-admin)/settings` |
| `/page.tsx` |

## API integrity output

```
RC1 API Integrity (static)
Frontend apiClient calls: 135
Backend routes: 148
Matched: 135
Missing backend: 0
Orphan backend routes: 20
Next.js pages: 46

Orphan backend routes (document if intentional):
  GET /adjustments/:id — adjustments
  GET /borrowers/my-registrations — borrowers
  GET /borrowers/reviewed — borrowers
  GET /borrowers/check-phone — borrowers
  GET /borrowers/check-id — borrowers
  GET /borrowers/check-name — borrowers
  GET /borrowers/check-active-loan — borrowers
  GET /borrowers/check-blacklist — borrowers
  DELETE /borrowers/:id/registration — borrowers
  GET /collectors/:id — collectors
  GET /groups/:id — groups
  GET /loan-pools/:id — loan-pools
  GET /borrowers/loan-eligible — loans
  GET /loans/:id — loans
  GET /messages/threads/:id — messages
  GET /reconciliations/:id — reconciliation
  GET /reports/daily-collection — reports
  GET /risk-flags/:id — risk-flags
  GET /uploads/signature — uploads
  GET /uploads/:id/content — uploads

PASS: all frontend apiClient paths have backend routes
```
