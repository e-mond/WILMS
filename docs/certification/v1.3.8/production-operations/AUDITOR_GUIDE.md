# Auditor Guide — WILMS v1.3.8

**Role:** Auditor  
**Portal:** Auditor (read-only)  
**Primary permissions:** `access-auditor-portal`, `view-reports`, `export-reports`, `view-audit-log`, `review-risk-flags`

## 1. Responsibilities

- Review financial and operational reports (read-only)
- Export reports for external audit (CSV, Excel, PDF per feature)
- Inspect immutable audit log
- Review risk flags
- **No mutation** of financial data, users, or settings

## 2. Separation of duties (SoD)

| Capability | Auditor | Notes |
|------------|---------|-------|
| View reports | ✓ | |
| Export reports | ✓ | |
| View audit log | ✓ | |
| Admin portal (`/ops`, reconciliation mutation) | ✗ | No `access-admin-portal` |
| Approve loans / sync conflicts | ✗ | Approver role |
| Record payments | ✗ | Collector role |

v1.3.8 remediation: auditors cannot access admin reconciliation review mutations.

## 3. Key paths

| Task | Path |
|------|------|
| Financial reports | Reports → Financial |
| Portfolio / collections | Reports → Collections |
| Audit log | Reports → Audit Log |
| Risk flags | Risk flags (read/review) |
| Export | Export actions on report views |

## 4. Audit log

- **Immutable** — no delete or edit in application
- Entries cover sensitive workflows: auth, user changes, financial events, adjustments
- Use date filters and search for investigations
- For security incidents, coordinate with Super Admin per [INCIDENT_RESPONSE_PLAYBOOK.md](./INCIDENT_RESPONSE_PLAYBOOK.md) § Security

## 5. Export workflow

1. Run report with correct date range and filters
2. Export to required format
3. Store exports per organizational retention policy
4. Verify totals match on-screen figures before external submission

Discrepancies → escalate to Super Admin / engineering (financial incident playbook). Do not request manual SQL fixes.

## 6. Financial verification tips

| Check | Compare |
|-------|---------|
| Pool capital | Dashboard vs pool report |
| Outstanding | Collections report vs loan portfolio |
| Expenses | Expense report vs cash flow |
| Adjustments | Audit log entries vs adjustment report |

Super Admin `/ops` financial snapshot is operational — formal audit uses reports + exports.

## 7. Production access

- Use organization-issued auditor credentials (not demo accounts)
- Session subject to timeout and lockout policy
- MFA if enabled by Super Admin

## 8. Troubleshooting

| Issue | Action |
|-------|--------|
| 403 on admin URL | Expected — use auditor routes only |
| Export empty | Widen date range; verify data exists |
| Report mismatch | Document screenshots; escalate L2 with timestamps |
| Missing audit entry | Escalate — potential logging gap |

## 9. Related docs

- [permission-matrix.md](../../../permission-matrix.md)
- [financial-calculations.md](../../../financial-calculations.md)
- [security-guide.md](../../../security-guide.md)
- [ADMINISTRATOR_GUIDE.md](./ADMINISTRATOR_GUIDE.md)
