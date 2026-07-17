# UI / UX Excellence Review (Phase 17)

**Date:** 17 July 2026  
**Scope:** Role portals (collector, officer, approver, auditor, admin), auth, onboarding, tours, notifications  
**Constraint:** Preserve existing design system; recommendations are incremental.

---

## 1. Cross-cutting

| Area | Current | Gap | Recommendation | Class |
|---|---|---|---|---|
| Accessibility | Partial audits in v1.3.7 cert | Focus order, live regions on money errors | WCAG 2.2 AA pass on collection + approval flows | High |
| Responsiveness | Mobile collector focus | Dense admin tables on tablet | Responsive table → card pattern for <1024px | Medium |
| Consistency | Shared components | Some legacy card/spacing drift | Token audit; remove one-off spacing | Medium |
| Loading | Mixed spinners | Inconsistent skeletons | Skeleton standards for tables/KPIs | Medium |
| Empty | Varied | Some blank panels | Illustrated empty + primary CTA per list | Medium |
| Error | ApiError toasts | Field-level mapping incomplete | Map 409/422 codes to inline guidance | High |
| Success | Toasts | Easy to miss offline | Persistent banner for queued sync | High |
| Motion | Limited | Tour/presence | 2–3 purposeful transitions; respect `prefers-reduced-motion` | Low |
| Search/filter/sort | Client-side often | Breaks at scale | Server-driven filter API | High |
| Charts | Dashboard widgets | May disagree historically | Bind only to SQL KPI API | Critical w/ PERF-01 |
| Notifications | In-app + push optional | Sound/permission UX | Clear permission priming; mute controls | Medium |

---

## 2. Role workflows

### Collector

| Strength | Gap | Rec | Class |
|---|---|---|---|
| Field payment + GPS UX | Offline queue fragility | IndexedDB queue + sync status screen | High |
| Same-day edit theatre removed | Need clear reverse/adjustment path | Deep-link “Request adjustment” (done directionally) | — |
| Recon pending | Resubmit UX after reject | Explicit resubmit CTA when REJECTED | High |

### Registration officer

| Gap | Rec | Class |
|---|---|---|
| Long forms | Section progress + save draft clarity | Medium |
| Document capture | Stronger failure recovery | Medium |

### Approver

| Gap | Rec | Class |
|---|---|---|
| Queue density | Bulk filters; risk callouts | Medium |
| Maker-checker visibility | Show who created loan before approve | High |

### Auditor

| Gap | Rec | Class |
|---|---|---|
| Read-only clarity | Watermark “read-only” on mutate-looking controls | Medium |
| Export packs | One-click period audit export (post GL) | High (v1.5) |

### Super Admin

| Gap | Rec | Class |
|---|---|---|
| Settings sprawl | Task-based IA (Users / Money / Comms / System) | Medium |
| Dangerous actions | Confirm + reason modal standardized | High |

### Borrower

| Note | Borrower self-service is limited/non-primary; any future portal needs separate UX program (v2.0). |

---

## 3. Product tour & onboarding

| Item | Rec | Class |
|---|---|---|
| Tour routes | CI test that tour targets resolve (404s fixed in prior sprint) | Medium |
| First-login | Role-specific checklist (not generic) | Medium |
| Invites | Copy emphasizes unique temp password + expiry | Medium |

---

## 4. Tables, forms, navigation

| Item | Rec | Class |
|---|---|---|
| Admin data tables | Virtualize at 500+ rows; server page | High |
| Forms | Disable submit until valid; show GPS required state | High |
| Navigation | Keep role portals separated; avoid cross-portal link leakage | High |
| Global search | Deferred until search index (v1.5+) | Medium |

---

## 5. Priority UX backlog (aligned with roadmap)

1. Sync status + offline confidence (collector)  
2. Error code → human guidance on money forms  
3. Server-driven lists (remove fake pagination)  
4. Approver “created by” visibility  
5. Admin IA cleanup  
6. A11y AA certification pass  

Do **not** redesign the brand visual system in this phase; fix operational clarity first.
