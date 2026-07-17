# Technical Debt Review

**Date:** 17 July 2026

## Paid down this sprint

- Dead payment-edit frontend path
- Dashboard type drift
- Dashboard N+1 / 2000-row KPI truncation risk
- Missing hot indexes
- Tour step padding / inaccurate expense copy
- Obsolete root cleanup report archived

## Remaining debt register

| ID | Item | Effort | Target |
|---|---|---|---|
| TD-01 | settings mega-service split | L | v1.4 |
| TD-02 | Client-side pagination everywhere | L | v1.4 |
| TD-03 | In-process queues | L | v1.4 |
| TD-04 | OpenAPI SSoT | M | v1.4 |
| TD-05 | Root FINAL_* sprawl | M | continuous archive |
| TD-06 | Mock editPayment interface | S | next cleanup PR |
| TD-07 | Borrower/loan list in dashboard | M | v1.4 |
| TD-08 | Node 20/22 skew | S | v1.4 |
| TD-09 | Double-entry GL | XL | v1.5–v2.0 |
| TD-10 | Tamper-evident audit | M | v1.5 |

## Principle

Prefer incremental extraction over clever rewrites. Debt that does not threaten money integrity can wait for scheduled refactors.
