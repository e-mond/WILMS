# Enterprise UX Review — Product Acceptance (v1.3.8)

**Phase:** 21  
**Date:** 17 July 2026  
**Reviewer posture:** QA Director / Product  
**Scope:** Staff-facing UX across five roles — not a full WCAG re-audit.

---

## 1. Navigation and information architecture

### 1.1 Shell navigation

Source: `apps/frontend/src/constants/navigation.ts`

| Role | Items | Notable routes |
|------|-------|----------------|
| Super Admin | 15 | `/dashboard`, `/loan-pools`, `/ops`, `/communication-center` |
| Collector | 7 | `/collector/reconciliation`, `/collector/admin-fee` |
| Registration Officer | 3 | `/officer/register` |
| Approver | 4 | `/approver/sync-conflicts` |
| Auditor | 3 | `/auditor/reports`, `/auditor/audit-log` |

**Finding:** All 32 nav `href` values resolve to existing `page.tsx` files under `apps/frontend/src/app/`. No dead-end nav items.

**Evidence:** Route groups `(super-admin)`, `(collector)`, `(approver)`, `(auditor)`, `(registration-officer)` map cleanly to URL paths.

### 1.2 Breadcrumbs and titles

- Utilities: `apps/frontend/src/tests/utils/shell-breadcrumbs.test.ts`, `shell-page-title.test.ts`
- Shell layout tests: `apps/frontend/src/tests/layouts/shells.test.tsx`

**Acceptance:** ✅ Consistent shell chrome per role.

---

## 2. Onboarding and guided tour

| Feature | Evidence | Status |
|---------|----------|--------|
| Mandatory product tour | `CHANGELOG.md` § 1.3.8 Added | ✅ |
| Per-role deep links | `product-tour-routes.test.ts` | ✅ |
| Expenses tour fix | No link to removed `/settings/expenses` | ✅ |
| Help FAB | CHANGELOG | ✅ |

**Acceptance:** First-run staff receive role-appropriate orientation without 404 tour steps.

---

## 3. Loading, feedback, and errors

| Pattern | Implementation | Tests |
|---------|----------------|-------|
| Skeleton loading | Skeleton system (CHANGELOG) | Super Admin dashboard tests |
| Toast deduplication | `notification-toast-tracker` | `notification-toast-tracker.test.ts` |
| Route error boundaries | Key Super Admin modules | CHANGELOG |
| Friendly error presentation | `query-error-presentation.test.ts` | ✅ |
| Currency display | `<CurrencyAmount />` | `CurrencyAmount.test.tsx` |

**Acceptance:** ✅ Enterprise-grade feedback for async operations; pesewas displayed consistently (ADR-004).

---

## 4. Role-specific UX

### 4.1 Super Admin

- Executive dashboard: `apps/frontend/src/features/super-admin-dashboard/`
- Operations dashboard: `apps/frontend/src/app/(super-admin)/ops/page.tsx` — health surfaces, financial snapshot, worker topology
- Reports hub: `/reports` with sub-reports (portfolio, ledger, defaulters, daily collection)

**Finding:** `/ops` gives ops visibility without exposing secrets (`ops/service.ts` comment line 3).

### 4.2 Collector (field)

- PWA/offline: `OfflineBanner`, `offlineQueueStore` tests
- App lock PIN: `app-lock/` tests, local device security per `security-guide.md`
- Collection sheet: `/collector/groups/[id]/collection-sheet/page.tsx`
- Mobile-responsive collectors list: `CollectorsMobileCardList.test.tsx`

**Finding:** Field UX supports intermittent connectivity; financial posts require approver for offline batches.

### 4.3 Registration Officer

- Multi-step registration: `MultiStepForm.test.tsx`, `registration.schema.test.ts`
- Character counters (v1.3.7+): full name, nationality per CHANGELOG

### 4.4 Approver

- Pending queue with detail: `/approver/pending/[id]`
- Offline sync conflicts panel: dedicated nav item
- Reviewed list: read-only history

### 4.5 Auditor

- Read-only reports and audit log
- No admin shell routes in `AUDITOR_NAV` — SoD reflected in UX

---

## 5. Permission UX (cosmetic layer)

`PermissionGate` (`apps/frontend/src/components/auth/PermissionGate.tsx`):

- Renders `null` (not CSS-hidden) when denied — ADR-002 compliant
- No context → renders children (dev/test convenience); **not** a security control

**Acceptance:** UI hides unauthorized actions; API `requirePermission` is enforcement source.

---

## 6. Responsive and accessibility

| Area | Evidence | Score impact |
|------|----------|--------------|
| Responsive reports | `ReportsIndexPanel.responsive.test.tsx` | UX +2 |
| Groups table truncation | CHANGELOG v1.3.7 | UX +1 |
| Currency / form components | Component tests | A11y partial |
| Full WCAG 2.1 AA audit | Not re-run Phase 21 | A11y 72/100 |

**Condition:** Schedule dedicated WCAG pass before claiming full AA compliance in production marketing.

---

## 7. Demo vs production UX

| Mode | Behaviour | Path |
|------|-----------|------|
| Mock/demo | `MockDataProvider`, demo banner | `DemoModeBanner.test.tsx` |
| Production | API provider forced | `next.config.mjs`, `mock-guard.ts` |

**Acceptance:** Production cannot boot with mock flags (`assertProductionMockDisabled` exits process).

---

## 8. UX findings summary

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| UX-01 | 32/32 nav targets live | — | ✅ Closed |
| UX-02 | Tour deep-links corrected | Low | ✅ Closed |
| UX-03 | Skeleton + error boundaries | — | ✅ Accepted |
| UX-04 | WCAG not re-certified this phase | Medium | ⚠ Condition |
| UX-05 | No borrower portal (by design) | — | ✅ Boundary |

---

## 9. UX sign-off

**Score:** 82/100 (see [LAUNCH_READINESS_SCORECARD.md](./LAUNCH_READINESS_SCORECARD.md))

Staff-facing enterprise UX is **accepted** for v1.3.8 operational use. Accessibility remains a **conditional** item for unconditional production marketing claims.
