# WILMS — Code Standards
> Women's Interest-Free Loan Management System | Coding Rules & Conventions

---

## 1. Language & Type Safety

- **TypeScript strict mode** is enabled in `tsconfig.json` — no exceptions
- `any` type is **banned** unless accompanied by an inline comment explaining why it cannot be avoided and what type narrowing exists
- All financial amounts must be typed as `number` and treated as integers representing **pesewas** (GHS × 100) to avoid floating-point rounding errors in loan calculations
- All API response shapes must be defined in `src/types/` — no inline type assertions from API calls
- Enum-like values (loan status, borrower status, transaction type, group risk level) must use `const` objects with `as const` and a corresponding union type — not plain strings

```typescript
// ✅ Correct
export const BORROWER_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  BLACKLISTED: 'BLACKLISTED',
} as const;
export type BorrowerStatus = typeof BORROWER_STATUS[keyof typeof BORROWER_STATUS];

// ❌ Wrong
type BorrowerStatus = string;
```

---

## 2. SOLID Principles Applied to WILMS

| Principle | WILMS Application |
|---|---|
| Single Responsibility | `PaymentEntryForm` handles form UI only — validation is a Zod schema, submission is a service call |
| Open/Closed | Loan status badge is driven by a status → config map; adding a new status extends the map, not the component |
| Liskov Substitution | Mock services implement the same interface as real services — swap requires no component changes |
| Interface Segregation | Collector-facing types do not include Super Admin fields; each role has its own API response shape |
| Dependency Inversion | Components depend on service interfaces, not concrete implementations |

---

## 3. Component Rules

- **One component per file.** File name matches exported component name exactly.
- **Feature components** live in `src/features/<feature>/components/`. They may use feature-specific state and services.
- **Shared components** live in `src/components/`. They must be generic, stateless or locally-stateful only. They must never import from `src/features/`, `src/services/`, or `src/state/`.
- **No component may import from `src/mocks/` directly** — ever.
- All shared components must accept a `className` prop for Tailwind overrides.
- Components exceeding 200 lines of JSX should be split.

### Naming Conventions
| Entity | Convention | Example |
|---|---|---|
| Components | PascalCase | `BorrowerStatusBadge` |
| Hooks | camelCase prefixed with `use` | `usePaymentQueue` |
| Services | camelCase suffixed with `Service` | `loanService` |
| Stores | camelCase suffixed with `Store` | `authStore` |
| Types/Interfaces | PascalCase | `LoanScheduleWeek` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_MISSED_PAYMENTS` |
| Files | kebab-case | `borrower-status-badge.tsx` |

---

## 4. Financial Logic Rules

These rules derive directly from the BRD and must never be violated in UI logic:

| Rule | BRD Reference | Implementation Note |
|---|---|---|
| No partial payments | §9.1 | Payment form rejects any amount < weekly required amount |
| No advance payments | §9.1 | Payment form disables future weeks; only current + arrears payable |
| Oldest obligation first | §9.1 | Payment always applied to earliest unpaid week |
| No manual balance entries | §11.1 | Balances are computed from transaction sum — never stored as editable fields |
| Full weekly amount only | §9.1 | Input validation: `amount === weeklyRequired + allOutstandingArrears` |
| Overpayment blocked | §16 | System blocks and flags any amount exceeding what is due |
| Duplicate transaction blocked | §16 | Same borrower + same date + same amount rejected |

---

## 5. Form Validation Standards (Zod)

All form schemas must be defined in a dedicated `<feature>.schema.ts` file alongside the form component.

Required validation by BRD:
- **Phone number:** unique across all borrowers (async validator calling `/borrowers/check-phone`)
- **ID number:** unique per ID type across all borrowers (async validator)
- **Guarantor phone:** must differ from borrower's phone
- **Loan amount:** must be a positive integer; weekly payment = amount ÷ duration (must divide evenly — flag if not)
- **Admin fee:** must be recorded before disbursement is enabled (enforced in loan state machine)
- **Payment amount:** must equal weeklyAmount + sum of all outstanding missed amounts (BRD §9.2)
- **Borrower photo:** required field; file type must be image/*; max size enforced

---

## 6. Styling Standards

- All styling via **Tailwind CSS utility classes** — no raw CSS values, no inline `style` props (except dynamically computed values like chart dimensions)
- All colour, typography, spacing, border-radius, and shadow values come from **design tokens defined in `tailwind.config.ts`** — no arbitrary values like `text-[#3a2b1c]`
- Design tokens map to WILMS semantic colours:
  - `brand-primary` — main action colour
  - `status-active` — green (active loans / low risk)
  - `status-at-risk` — amber (1 missed payment)
  - `status-defaulted` — red (2+ consecutive missed)
  - `status-blacklisted` — dark red / muted (permanently barred)
  - `status-pending` — neutral (awaiting approval)
- Any pattern used in more than one place must become a shared component — no duplicated Tailwind class blocks

---

## 7. Banned Patterns

These patterns are prohibited and will fail code review:

```typescript
// ❌ console.log anywhere in committed code
console.log('payment recorded');          // use logger.ts

// ❌ dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: borrowerNote }} />

// ❌ Storing tokens in localStorage
localStorage.setItem('authToken', token);

// ❌ Hardcoded API URLs
fetch('https://api.wilms-prod.example.com/loans');  // use env var

// ❌ Importing mocks from feature code
import { mockBorrowers } from '@/mocks/borrowers';  // only services/ may do this

// ❌ Unguarded role-based UI (hide instead of remove)
{currentUser.role !== 'COLLECTOR' && <style>display:none</style>}  // render null instead

// ❌ Direct balance mutation
borrower.outstandingBalance = newAmount;  // derive from transactions only

// ❌ Unresolved TODO at delivery
// TODO: add validation here
```

---

## 8. Error Handling Standards

- Every async operation (form submit, data fetch) must handle loading, success, and error states
- Error messages shown in the UI must be human-readable and actionable — never raw error objects or stack traces
- Form errors must be field-level (not just a toast) for all validation failures
- API errors must be mapped to user-facing messages in the service layer before reaching the component
- Global error boundaries at app level and feature level — no unhandled crashes expose raw React error output

---

## 9. Commit Standards

```
feat(borrower-registration): add duplicate phone number detection
fix(payment-form): prevent advance payment entry
test(reconciliation): add integration tests for variance calculation
docs(context): update progress-tracker after payment module completion
refactor(loan-schedule): extract weekly calculation to utility hook
perf(collector-dashboard): memoize borrower list sort to prevent re-renders
chore(deps): pin react-hook-form to 7.51.3
```

- Each commit corresponds to one passing implementation unit
- Never commit with failing lint, type-check, tests, or build

---

## 10. Mandatory Validation Commands

Run after every implementation unit:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

If a dependency was added or updated:

```bash
npm audit
npm outdated
```

If any command fails: **stop, fix, re-run all four, then proceed.**

---

## 10. Export & Reporting Standards

All export, print, PDF, and Excel functionality must use `src/features/export/`. See `context/export-strategy.md`.

| Rule | Requirement |
|---|---|
| No custom formatting | Pages must not implement standalone CSV/PDF/print logic |
| Report traceability | Every export includes report ID, timestamp, generated-by, environment |
| Print isolation | Use `printWilmsDocument()` — never print the live app shell |
| Human-readable CSV | Column headers must be plain language (`Borrower ID`, not `borrower_id`) |
| Branded documents | Use WILMS colours, typography, header/footer templates from the framework |
