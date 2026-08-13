# Borrower Dashboard Fix

## Quick Actions

`BorrowersAsidePanel` previously showed static guidance copy only.

It now exposes permission-aware actions:

| Action | Route / behaviour | Permission |
| --- | --- | --- |
| Add Borrower | `/borrowers/new` | `register-borrowers` |
| Import Borrowers | `/borrowers/import` (CSV → pending registrations) | `register-borrowers` |
| Assign Group | `/groups` | `manage-groups` / admin |
| Reassign Collector | `/ops/reassignment` | `manage-groups` / admin |
| Export Borrowers | WILMS export modal | `export-reports` / admin |
| View Pending Registrations | `/borrowers?status=PENDING` | review / approve / admin |

## Six-month performance chart

The “6-Month Performance” chart (Collectors aside / profile) previously used hard-coded Jan–Mar zeros from domain `EMPTY_MONTHLY`.

It now always uses the rolling last six calendar months from production payment vs expected series.

## Borrower profile

- Group Role: Group Leader / Group Member with leader badge
- Associated group link
- Collector label `Name (COL-###)`
- Profile photo size increased to Avatar `xl` (~96px)
