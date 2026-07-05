# Hardcoded Data Audit ÔÇö v3 (P11b)

> Repository scan focus: UI components, pages, layout | Date: 2026-06-09

## Compliant patterns

- Dashboard KPIs, collection metrics, expense summaries ÔåÆ services/selectors
- Registration legal copy ÔåÆ `settingsService.getRegistrationLegalConfig()`
- Guarantor limits ÔåÆ `checkGuarantorEligibility` service
- Role labels ÔåÆ `getRoleLabel()` from session
- Mock fixtures centralized under `mocks/` and `services/mock/`

## Acceptable configuration (not business data)

| Location | Content | Rationale |
|---|---|---|
| `constants/navigation.ts` | Nav hrefs/labels | Shell config |
| `SuperAdminDashboard` QUICK_ACTIONS | Action hrefs | Navigation shortcuts |
| `constants/dashboard-display.ts` | Tone class maps | Presentation tokens |
| `constants/borrower-registration.ts` | Region/work options | Reference data catalog |

## Remaining violations / risks

| Severity | Location | Issue | Remediation |
|---|---|---|---|
| Medium | `DashboardCollectionSummary` | Fixed period labels in component | Move to constants or service metadata |
| Medium | Various tables | Demo avatar initials only | Pass `photoUrl` from service when API available |
| Low | `PhoneCaptureSessionPanel` | QuickChart QR URL | Replace with backend QR asset |
| Low | `CollectorExpenseForm` CATEGORY_LABELS | Inline map | Move to `constants/expenses.ts` |

## Inline color audit

No new raw hex values introduced in P11b shell/registration pass. Signature pad stroke uses `#111827` (maps to design token ÔÇö consider `text-text-primary` via canvas refactor).

## Mock-only data (expected)

All numeric KPIs, counts, guarantor guarantee totals, and expense aggregates originate from mock services until API integration.

## Sign-off

**UI hardcoded business statistics:** cleared for dashboard and registration review.  
**Page-level demo constants:** none added in P11b.  
**Next scan:** after backend integration PR merges.
