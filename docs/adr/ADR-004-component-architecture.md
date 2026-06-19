# ADR-004 — Component Architecture

**Status:** Accepted
**Date:** Phase 2, May 2026

---

## Context

WILMS has two UI audiences with fundamentally different needs:

- **Admin/Office users** (Super Admin, Approver, Registration Officer) need data-dense, tabular, filterable interfaces with complex workflows and multi-step forms
- **Collectors** need minimal, thumb-friendly, fast-loading mobile screens with large touch targets and offline indicators

The component architecture must:
- Prevent UI duplication (a `StatusBadge` must not exist in 3 places with 3 slightly different implementations)
- Enforce the mock isolation rule (no component imports from `src/mocks/`)
- Support WCAG 2.1 AA accessibility without per-component accessibility retrofitting
- Accommodate the financial display rules (amounts always in GHS, derived from server data, displayed in `text-mono` token, never editable as direct balance fields)
- Scale to 30+ pages across 4 roles without architectural confusion

---

## Decision

### Three-Tier Component Model

**Tier 1 — Primitives** (`src/components/ui/`)
- Generic, stateless or locally-stateful UI atoms
- Zero knowledge of WILMS domain (no borrower, loan, payment concepts)
- Used everywhere; imported by Tier 2 and Tier 3
- Examples: `Button`, `Input`, `Modal`, `Badge`, `Tooltip`, `Select`, `Tabs`, `Pagination`
- Accessibility baked in at this tier — all keyboard navigation, ARIA roles, focus management

**Tier 2 — Domain Components** (`src/components/data-display/`, `src/components/forms/`, `src/components/feedback/`)
- WILMS-domain-aware shared components
- May use Tier 1 primitives; may accept typed WILMS data via props
- Must not fetch data directly — data is always passed via props or children
- Examples: `StatusBadge` (borrower/group/loan statuses), `LoanScheduleTable`, `TransactionLog`, `CollectorPerformanceCard`, `StatCard`, `ReconciliationForm`
- Used across multiple features

**Tier 3 — Feature Components** (`src/features/<feature>/components/`)
- Scoped to one feature module
- May fetch their own data via TanStack Query hooks
- May use Zustand stores
- May use Tier 1 and Tier 2 components
- Must not be imported by other feature modules — cross-feature needs → extract to Tier 2
- Examples: `BorrowerRegistrationWizard`, `PaymentEntryForm`, `DailyReconciliationPanel`

### Import Rule (Enforced by ESLint)

```
Tier 1 (ui/) → imports: nothing from src/
Tier 2 (data-display/, forms/, feedback/) → imports: Tier 1 only
Tier 3 (features/) → imports: Tier 1, Tier 2, feature-local hooks and services
```

No tier may import from `src/mocks/`.

### WILMS-Specific Financial Display Rules

- All GHS amounts rendered via a shared `<CurrencyAmount value={pesewas} />` component — never raw number display
- Amount formatting: `GHS X,XXX.XX` with comma separator — `Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' })`
- Amount inputs in the payment form: the field shows GHS amount; internally stored as pesewas (× 100 integer) to avoid float errors
- Balance fields are read-only display — no editable balance inputs anywhere in the UI

### Status Badge Centralisation

All status concepts in WILMS (borrower status, group risk, loan status, transaction type) are rendered by a single `StatusBadge` component driven by a central status → style config map:

```typescript
// src/constants/statusConfig.ts
export const BORROWER_STATUS_CONFIG: Record<BorrowerStatus, StatusConfig> = {
  PENDING:     { label: 'Pending',     color: 'status-pending',     icon: ClockIcon },
  APPROVED:    { label: 'Approved',    color: 'status-active',      icon: CheckIcon },
  REJECTED:    { label: 'Rejected',    color: 'status-defaulted',   icon: XIcon },
  BLACKLISTED: { label: 'Blacklisted', color: 'status-blacklisted', icon: BanIcon },
};
```

Adding a new status means adding one row to this config — no component changes.

### Accessibility Architecture

Accessibility is built into Tier 1. Every Tier 1 component ships with:
- Correct semantic HTML (`<button>` not `<div onClick>`)
- Keyboard event handlers (Enter, Space, Escape, Arrow keys where applicable)
- ARIA attributes (`aria-label`, `aria-describedby`, `aria-expanded`, `role`)
- Focus management (Modal traps focus; closing returns focus to trigger element)
- `StatusBadge` always has text alongside colour (never colour-only status)

Tiers 2 and 3 inherit accessibility from Tier 1; they must not override or remove ARIA attributes.

### Offline-Aware Collector Components

Collector-facing Tier 3 components must consume the `useOfflineStatus` hook and handle three states:
1. **Online** — normal flow
2. **Offline** — form submission enters offline queue; `OfflineBanner` shown; submit button labelled "Save for Sync"
3. **Syncing** — queued items draining; progress indicator per item

---

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| Flat component directory (all components in `src/components/`) | Scales poorly to 30+ pages and 4 roles; no clear domain vs primitive separation |
| Atomic Design (atoms / molecules / organisms / templates / pages) | Standard Atomic Design doesn't map cleanly to WILMS's feature-scoped vs shared distinction; "organism" is ambiguous for WILMS's data-fetch boundary |
| Separate component library (npm package) | Overkill for a single application; adds build complexity |
| Storybook for component docs | Valuable but deferred to Phase 2 once component surface stabilises |
| CSS Modules instead of Tailwind | Would lose design token enforcement; Tailwind's purge ensures zero unused styles in production |

---

## Trade-offs

| What is gained | What is sacrificed |
|---|---|
| Zero duplicated status badges or amount displays | Stricter discipline required — developers must look for existing Tier 1/2 components before building new ones |
| Accessibility guaranteed at Tier 1 | Tier 1 components are more complex to build initially |
| Financial display consistency (GHS, pesewas, read-only balances) | Extra indirection via `CurrencyAmount` component |
| Mock isolation enforced structurally | ESLint rule enforcement requires setup |

---

## Consequences

- Before creating any new component, check Tier 1 and Tier 2 first — duplication is a code review failure
- The `CurrencyAmount` component is mandatory for all GHS display — raw `{amount}` renders for financial values are rejected in code review
- ESLint import rules must be configured to enforce tier boundaries and the mock isolation rule
- Any pattern that appears in 2+ features must be extracted to Tier 2 before the second usage is merged
- The `StatusBadge` config map is the canonical source of truth for all status labels and colours in the system
