# WILMS v1.3.8 — Production Defect Fixes

## Scope

Verified production defects reported against `https://wilms.vercel.app`, plus reliability fixes for the guided tour and in-app sounds. Feature freeze respected: no new product capabilities beyond completing the missing pool→group linkage required for utilisation.

## Defects

### 1. `/settings/expenses` 404

| | |
|---|---|
| **Symptom** | Tour / navigation landed on Page not found |
| **Cause** | Tour Super Admin Expenses step used `href: '/settings/expenses'`. Live route is `/expenses`. |
| **Fix** | Corrected all role tour routes; Help FAB role guide uses `/settings?section=roles`. |

### 2. Pool utilisation blank after create + disburse

| | |
|---|---|
| **Symptom** | New pool stayed at 0% utilisation / zero disbursed after a loan was disbursed |
| **Cause** | Disbursement only attributes capital when `loans.loan_pool_id` resolves via `pool_memberships`. Creating a pool did not assign groups, and loan create had no pool selector. |
| **Fix** | Optional `groupIds` on pool create; `POST /loan-pools/:id/memberships`; unassigned-groups API; loan create `loanPoolId` (required when pools exist); single-pool auto-link; disburse fails clearly when unlinked; frontend cache invalidation on disburse. |

### 3. Login / notification sounds

| | |
|---|---|
| **Symptom** | Login chime often silent; many notification types had no sound |
| **Cause** | `AudioContext` created after `await login()` loses user-gesture unlock; bridge only sounded a subset of events |
| **Fix** | Shared warmed `AudioContext` on login/OTP gesture; richer login chime; default tone for remaining inbox events (all roles). |

### 4. Tour UX

Progress bar, step dots, nav `data-tour-nav` highlights, navigation wait state, reduced-motion-safe animations, keyboard tip.

## Verification

- `npm run type-check` — pass
- `npm run lint -w @wilms/frontend` — pass
- Targeted unit tests (tour routes, pool aggregates, CreateLoanWizard, loan-pools service) — pass

## Remaining external blockers

Deploy sync to production, smoke credentials, and ops validation remain outside this code change.
