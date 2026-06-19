# WILMS — UI Context
> Women's Interest-Free Loan Management System | Interface Architecture & Design Reference

---

## 1. UI Philosophy

WILMS serves two distinct operating environments:

- **Office/Admin UI** (Super Admin, Approver, Registration Officer): Desktop-first; data-dense; table-heavy; supports complex workflows
- **Field/Collector UI**: Mobile-first; thumb-friendly; must load in < 2 seconds on 3G; must work offline; minimal cognitive load under field conditions

These two modes are structurally separated via role-based shell layouts.

### Shell Layouts (ADR-005)

All authenticated roles compose **`DashboardShell`** (`src/components/layout/shell/`):

```text
AppNavbar (full width)
├── AppSidebar (collapsible w-60 / w-16)
├── MainContent (ShellMainLandmark)
└── AppAside (xl+ office profile; AsideSlotProvider)
OfficeShellFooter
```

| Shell | Profile | Layout | Theme toggle |
|---|---|---|---|
| Super Admin | `office` via `OfficeShell` | Navbar + collapsible sidebar + AppAside + footer | Yes (`AppNavbar`) |
| Registration Officer | `office` | Same | Yes |
| Approver | `office` | Same | Yes |
| Collector | `field` | Bottom nav mobile; sidebar desktop; no AppAside; `CollectorOfflineShell` wrapper | Yes |

Approved reference JPEGs: `context/design-references/` (binding visual requirements).

Officer and Approver shells auto-apply executive dark theme on first visit (`ExecutiveThemeInitializer`), same as Super Admin.

Office roles use `PageShell` for content padding. Super Admin uses `PageShell variant="executive"` (tighter spacing; no inline breadcrumbs/descriptions).

**Super Admin header** — `OfficeShellHeader variant="executive"` renders route breadcrumbs (`Dashboard > Loan Pools`) plus LIVE badge; page `<h1>` is screen-reader only on list pages. Detail/profile/field panels may expose a visible `<h1>` for the entity name.

**Applications nav** — Super Admin sidebar "Applications" links to `/borrowers?status=PENDING` (pending borrower filter).

**Notifications** — `notificationService.sendNotification` (NF-01) plus in-app inbox (`listInbox`, `getUnreadCount`, `markAsRead`) wired to Super Admin navbar **Alerts** trigger + right drawer (NF-03). **Global search (GS-01)** — `AppNavbar` omnibar (`GlobalSearchPanel`, Ctrl+K) with role-scoped cross-entity results. **Field connection chip** — collector navbar shows Online/Offline via `useOfflineStatus`. **App lock** — navbar Lock / Set PIN when `appLockStore.isEnabled`. **Profile menu** — avatar dropdown with logout (+ collector Security link). **Toast UI** — centralized `ToastContainer` + `useToast()` / `uiStore` (success, error, warning, info, offline, sync); mounted in root layout; collector offline/sync events surface via toasts + `OfflineBanner`.

### Bootstrap & Loading (UX-03)

| Screen | Component | When shown |
|---|---|---|
| Session restore | `AppBootstrap` + `WilmsSplashScreen` | Until auth, theme, and app-lock stores hydrate |
| Role check | `WilmsSplashScreen` in `RoleGuard` | Auth store not yet hydrated on protected routes |
| Offline queue sync | `OfflineInitOverlay` | Collector shell while `syncState === 'syncing'` with pending items |

All splash screens use WILMS branding and design tokens (light/dark).

### App Lock (UX-02)

Field and office sessions can enable an optional **six-digit device PIN** (`appLockStore`, persisted in localStorage).

| Behaviour | Detail |
|---|---|
| Setup | `/collector/security` — set, confirm, change, or disable PIN |
| Lock triggers | 5-minute idle timeout; tab hidden (`visibilitychange`) |
| Unlock | `AppLockOverlay` + `PinEntryPad`; wrong PIN shows attempts remaining |
| Lockout | 5 failed attempts → full sign-out (session cleared) |
| User change | PIN cleared when a different user signs in on the same device |
| vs session expiry | PIN lock keeps the httpOnly session; expiry still forces re-login |

Lock screen uses design tokens and supports light/dark mode.

### Theme Modes

- **Light** — default `:root` tokens (green primary, warm background)
- **Dark** — `.dark` / `data-theme="dark"` on `<html>`; persisted in `themeStore` (localStorage)
- **Executive default** — first Super Admin visit auto-applies dark via `ExecutiveThemeInitializer` (user toggle still persisted)
- **Executive sidebar** — Super Admin sidebar uses `data-sidebar="executive"` scoped tokens (gold accent on dark sidebar)
- **Executive content** — main area uses `[data-executive-content]` scoped tokens (#121212 background, gold primary) **only when global theme is dark**; light mode uses standard `:root` tokens so theme toggle applies consistently

Toggle via `ThemeToggle` in every role shell.

### Executive Management Layout (UI-02)

Reference: uploaded Super Admin dashboard images (Loan Pools, Groups, Collectors, Risk & Flags).

| Component | Path | Purpose |
|---|---|---|
| `ExecutiveKpiGrid` | `components/layout/executive/` | 4-column KPI row |
| `ManagementToolbar` | `components/layout/executive/` | Search + filter pills + Export/actions bar |
| `FilterPillBar` | `components/layout/executive/` | Gold active-state segmented filters |
| `DetailSidebarCard` | `components/layout/executive/` | Right-panel detail/widgets |
| `ExecutiveDetailLayout` | `components/layout/` | 2fr + 1fr table + sidebar grid |
| `KpiCard variant="executive"` | `components/data-display/` | Uppercase labels, display-sized metrics |
| `DataTable variant="executive"` | `components/data-display/` | Uppercase headers, row selection/hover |

**Visual rules:** flat design, no gradients/glassmorphism, minimal shadows, gold IDs/metrics, semantic green/red financial tones, data-dense grouping.

---

## 2. Design System

All values must come from tokens defined in `tailwind.config.ts`. No arbitrary values.

### Colour Tokens

| Token | Usage | Hex (suggested) |
|---|---|---|
Primary: #0F6E56
Primary Light: #E1F5EE

Warning: #BA7517
Warning Light: #FAEEDA

Danger: #993C1D
Danger Light: #FAECE7

Success: #3B6D11
Success Light: #EAF3DE

Background: #F1EFE8
Card: #FFFFFF

Text Primary: #2C2C2A
Text Muted: #5F5E5A

Border: #D3D1C7

### Typography Tokens

| Token | Size | Weight | Usage |
|---|---|---|---|
| `text-display` | 30px / 1.2 | 700 | Dashboard headline figures |
| `text-heading-1` | 24px / 1.3 | 700 | Page titles |
| `text-heading-2` | 20px / 1.4 | 600 | Section headings |
| `text-heading-3` | 16px / 1.5 | 600 | Card headings, table section labels |
| `text-body` | 14px / 1.6 | 400 | Default body text |
| `text-small` | 12px / 1.5 | 400 | Labels, captions, helper text |
| `text-mono` | 13px / 1.4 | 400 | Financial amounts, IDs |

### Spacing Scale

Use Tailwind's 4px base grid. No one-off values.

| Token | Value | Common Usage |
|---|---|---|
| `space-1` | 4px | Icon padding |
| `space-2` | 8px | Inline element gaps |
| `space-3` | 12px | Form field gaps |
| `space-4` | 16px | Card padding |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Page section gaps |
| `space-12` | 48px | Major layout sections |

---

## 3. Page Hierarchy

### Super Admin Shell
```
/                            → redirect to /dashboard
/dashboard                   → System dashboard (financial overview, risk summary)
/borrowers                   → Borrower list (search, filter by status/community)
/borrowers/[id]              → Borrower profile (loan history, schedule, transactions)
/borrowers/[id]/loan         → Loan detail (weekly schedule, payment log)
/loans                       → Loan portfolio (all active loans, filters)
/loans/new                   → Create new loan (for approved borrower post-admin-fee)
/collectors                  → Collector list + performance summary
/collectors/[id]             → Collector profile + daily performance log
/groups                      → Group list (risk level, community)
/groups/[id]                 → Group profile (members, risk history)
/reports/loan-portfolio      → Loan Portfolio Report
/reports/daily-collection    → Daily Collection Report
/reports/defaulters          → Defaulter Report
/reports/collector-performance → Collector Performance Report
/reports/group-risk          → Group Risk Report
/reports/financial-ledger    → Financial Ledger Report
/reports/audit-log           → Audit Log Report
/adjustments                 → Pending adjustment approvals
/settings                    → System configuration (fee amount, SMS templates, holidays)
```

### Collector Shell (mobile-first)
```
/collector/dashboard         → Today's collection summary + alerts
/collector/my-borrowers      → Assigned borrower list (payment status today)
/collector/payment/[id]      → Record payment for borrower
/collector/reconciliation    → Daily reconciliation form
```

### Registration Officer Shell
```
/officer/register            → New borrower registration form (multi-step)
/officer/my-registrations    → List of own registered borrowers + status
```

### Approver Shell
```
/approver/pending            → Queue of pending borrower applications
/approver/pending/[id]       → Review borrower profile → Approve / Reject / Blacklist
/approver/reviewed           → History of own decisions
```

### Auth
```
/login                       → Branded login card, password show/hide, remember-email, theme toggle
/session-expired             → Session expiry notice with re-login CTA
```

---

## 4. Component Hierarchy

### Shared Primitives (`src/components/ui/`)
- `Button` — variants: primary, secondary, danger, ghost; sizes: sm, md, lg
- `Input` — text, number, date, phone, search
- `Select` — single and multi-select with search
- `Textarea`
- `FileUpload` — drag-and-drop + mobile camera; accepts image/* only
- `Modal` — focus-trapped; keyboard-dismissible; accessible
- `Drawer` — slide-in panel with focus trap (office mobile navigation; reusable for field actions)
- `Badge` — status badges (Active, At Risk, Defaulted, Blacklisted, Pending, Approved, Rejected)
- `Tooltip`
- `ProgressBar` — loan repayment progress
- `Tabs`
- `Breadcrumb`
- `Pagination`
- `Checkbox` / `Radio` / `Switch`

### Data Display (`src/components/data-display/`)
- `DataTable` — sortable, filterable, paginated; supports virtualization for 100+ rows
- `StatCard` — single metric display (label, value, trend indicator)
- `LoanScheduleTable` — week-by-week schedule with Paid/Missed/Pending status
- `TransactionLog` — chronological transaction list with type badges
- `StatusBadge` — semantic status display driven by status → config map
- `CollectorPerformanceCard` — collection rate, variance, edit frequency
- `GroupRiskCard` — group members, risk level, missed payment count

### Forms (`src/components/forms/`)
- `FormField` — label + input + error message wrapper
- `FormSection` — labelled section within a multi-step form
- `MultiStepForm` — step indicator + navigation (used for borrower registration)
- `PhotoUpload` — camera-first on mobile; file picker fallback

### Feedback (`src/components/feedback/`)
- `Toast` — success, warning, error, info, offline, sync; auto-dismiss via `ToastContainer` + `useToast()` / `mutation-feedback` helpers on mutations
- `Tabs` — keyboard-accessible tablist + panels
- `Tooltip` — hover/focus tooltip with token styling
- `Pagination` — previous/next page control
- `Alert` — inline alert banner (reconciliation mismatch, fraud alerts)
- `EmptyState` — illustrated empty states for zero-result data views
- `LoadingSpinner` / `SkeletonLoader`
- `OfflineBanner` — visible indicator when Collector is offline
- `DemoModeBanner` — visible only in development; always shown

---

## 5. Primary User Journeys (Step by Step)

### Journey A — Register a New Borrower (Registration Officer)
1. `/officer/register` loads multi-step form
2. **Step 1 — Personal Details:** Full Name, DOB, Gender, Phone, Email, Nationality, ID Type, ID Number
3. **Step 2 — Address:** House Address, GPS Address, City, Region, District
4. **Step 3 — Business Info:** Business Name, Business Address, Type of Work
5. **Step 4 — Guarantor:** Name, Phone, Relationship
6. **Step 5 — Photo:** Upload passport-style photo
7. **Step 6 — Review:** Summary of all entered data before submission
8. On submit → system runs duplicate/conflict detection (async)
9. If conflicts found → blocked; reason shown on relevant step
10. If clear → borrower saved with status = **Pending**; officer sees success state

### Journey B — Approve a Borrower (Approver)
1. `/approver/pending` shows queue of Pending applications
2. Approver selects application → `/approver/pending/[id]`
3. Full borrower profile shown with documents and photo
4. Approver selects: **Approve** / **Reject** / **Blacklist** + mandatory reason text
5. Confirmation dialog → action confirmed → status updated
6. SMS + Email triggered (Approved or Rejected)
7. Approver redirected to next pending application or queue

### Journey C — Record a Weekly Payment (Collector)
1. `/collector/my-borrowers` shows today's list sorted by: overdue first
2. Collector taps borrower → `/collector/payment/[id]`
3. Payment screen shows: amount due (weekly + any arrears), borrower name, week number
4. Collector enters collected amount (must equal displayed due amount)
5. GPS captured automatically → if denied, error shown; cannot proceed
6. Submit → payment recorded; SMS sent to borrower
7. Collector returns to borrower list; borrower marked ✅ Paid

### Journey D — Daily Reconciliation (Collector)
1. End of day → Collector navigates to `/collector/reconciliation`
2. System shows: Expected Total (auto-calculated), Collected Total (from system records)
3. Collector enters Physical Cash amount
4. System calculates variance
5. If variance = 0 → green confirmation
6. If variance > threshold → orange warning; Super Admin alerted
7. Collector submits → reconciliation locked

### Journey E — Review Audit Log (Super Admin)
1. `/reports/audit-log` → date range picker + user filter + action type filter
2. Immutable log displayed in reverse chronological order
3. Each row: timestamp, user, role, action type, entity affected, before/after values, GPS (for field actions)
4. Export to CSV available

---

## 6. Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| Mobile 375px | Collector UI primary; single column; bottom drawer for actions; thumb-zone navigation |
| Tablet 768px | Registration Officer / Approver; two-column forms; side navigation |
| Desktop 1280px | Super Admin primary; full data tables; sidebar navigation; multi-panel layouts |
| Wide 1536px | Extended table columns; dashboard widget grid expands |

**Critical rule:** The Collector dashboard and payment flow must be fully functional and meet < 2 second load time at 375px on a simulated 3G connection. This is the highest-priority performance requirement.

---

## 7. Accessibility Requirements

- All interactive elements reachable and operable by keyboard
- Focus order is logical; focus never lost on modal close or route change
- All form fields have visible labels (not placeholder-only)
- All status badges have text, not colour-only distinction
- All icons have `aria-label` or accompanying visible text
- Minimum contrast: 4.5:1 for normal text; 3:1 for large text (WCAG 2.1 AA)
- All data tables have proper `<th scope>` and `<caption>` elements
- Offline banner and Demo Mode banner announced to screen readers via `role="status"`

---

## 8. Export & Print UI Standard

All export actions use `src/features/export/`. See `context/export-strategy.md`.

| UI pattern | Component | Used on |
|---|---|---|
| List/report CSV | `ExportCsvButton` | Groups, borrowers, collectors, pools, reports |
| Full entity export | `WilmsExportActions` | Group profile (CSV, Excel, Print, PDF) |

Print and PDF outputs use dedicated WILMS document templates — not the live app shell. Brand colours: Primary `#0F6E56`, Accent `#BA7517`. Typography: DM Sans / DM Serif Display.

---

## 9. Demo Mode (Development Only)

When `NODE_ENV=development`:
- A persistent, non-dismissable banner appears at the top of every page: **"DEMO MODE — No real data is being used"**
- Banner uses `role="status"` for screen reader accessibility
- Colour: amber background with dark text (meets contrast requirements)
- The banner is excluded from the production build entirely via build-time environment check


