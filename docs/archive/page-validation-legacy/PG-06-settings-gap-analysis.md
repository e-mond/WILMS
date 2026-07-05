# PG-06 ÔÇö `/settings` Design Validation Gap Analysis
> **Authoritative reference:** `context/design-references/Settings.jpeg`  
> **Route:** `/settings`  
> **Date:** 2026-06-09  
> **Status:** Ô£à **COMPLETE** ÔÇö closure `PG-06-settings-closure.md`

---

## Validation method

| Step | Result |
|---|---|
| Reference JPEG present and inspected | Ô£à |
| Implementation audit (`SettingsPanel.tsx`, `SettingsAsidePanel.tsx`) | Ô£à |
| Widget inventory vs image | Ô£à |

**Prerequisite:** PG-05 complete Ô£à.

---

## Reference layout

```text
AppNavbar: Dashboard > Settings ┬À LIVE ┬À datetime ┬À bell ┬À profile
Left nav: Category list with gold active marker
Main: Section content (General KPIs, Security, Users table, Loan Rules, SMS, etc.)
AppAside:
  - System Status
  - Recent Changes
  - Audit Activity (context-aware to active section)
```

---

## Gap remediation tasks

### P0 ÔÇö Navigation & sections Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-06-R01 | 10 settings categories | Image nav | Ô£à `SETTINGS_SECTIONS` |
| PG-06-R02 | Gold active nav marker | Image | Ô£à `border-executive-gold text-executive-gold` |
| PG-06-R03 | No placeholder ÔÇ£Coming SoonÔÇØ sections | BRD | Ô£à Read-only demo content for all categories |

### P1 ÔÇö Visual fidelity Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-06-R04 | General KPI row | Image | Ô£à Admin fee, reconciliation, reminder KPIs |
| PG-06-R05 | Users table with avatars | Image | Ô£à `SETTINGS_DEMO_USERS` DataTable |
| PG-06-R06 | Security toggles (read-only demo) | Image | Ô£à Switch components |
| PG-06-R07 | Dedicated aside panel | Image | Ô£à `SettingsAsidePanel` |
| PG-06-R08 | Dark/light mode support | Architecture | Ô£à Semantic tokens + ThemeToggle in shell |

### P2 ÔÇö Polish Ô£à

| ID | Gap | Reference | Implementation |
|---|---|---|---|
| PG-06-R09 | Responsive category nav + content grid | PWA | Ô£à `xl:grid-cols-[220px_minmax(0,1fr)]` |
| PG-06-R10 | Aside drawer E2E | Shell architecture | Ô£à `e2e/shell-navbar.spec.ts` |
| PG-06-R11 | Accessible category nav | WCAG | Ô£à `aria-label`, `aria-current="page"` |

---

## Residual (non-blocking)

- Save / invite actions remain demo toasts until settings API is connected.
