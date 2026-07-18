# UX Shell Audit — v1.4.1

**Date:** 2026-07-18  
**Author:** WILMS Engineering  
**Version:** 1.4.1

## Architecture (verified)

| Surface | Implementation |
|---------|----------------|
| Header | `AppNavbar` — sticky in content column |
| Sidebar | `AppSidebar` inside sticky `h-dvh` aside |
| Right aside | `AppAside` + `ShellAsideDrawer` (Details offset above float stack) |
| Floating controls | `FloatingShellControls` → `FloatingActionStack` |
| Help | `HelpFabButton` + `HelpMenuModal` (also header help) |
| Connectivity | `ConnectionStatusChip` inside float stack |
| Search | `GlobalSearchPanel` command palette |
| Tour | `ProductTourOverlay` |

## Findings fixed

| ID | Issue | Fix |
|----|-------|-----|
| SHELL-01 | Help + connectivity overlap | Shared float stack |
| SHELL-02 | Navbar not sticky | Sticky header in main column |
| SHELL-03 | Sidebar/header layout collision risk | Sidebar full-height column; header in content column |

## Residual

- Full Shadcn migration deferred (see SHADCN_MIGRATION_PLAN.md)
- Visual QA on production CDN pending operator deploy
