# BRD Edge Case Report (v1.6.2)

| Edge case | Status | Implementation |
|-----------|--------|----------------|
| Holiday payment handling | Complete (API + UI + shift helpers) | `organization-holidays`, Settings Holidays, `holiday-shift.ts`, schedule-change approve path |
| Borrower relocation | Complete | `POST /borrowers/:id/relocate`, audit `BORROWER_RELOCATED` |
| Loan write-off | Complete (extends adjustments) | Request UI + approve queue + write-off report; blacklist/pool effects on approve |
| Group dissolution | Complete | `POST /groups/:id/dissolve`, status `DISSOLVED`, history table |
| Member replacement | Complete | `POST /groups/:id/replace-member` + approve |
| Emergency reschedule | Complete | Request / review / Super Admin approve + schedule-changed notify |

Migration: `0034_enterprise_readiness_workflows`.
