# Security Audit — v1.4 UX Modernisation (Delta)

**Date:** 2026-07-18  
**Author:** WILMS Engineering  
**Baseline:** v1.3.8 enterprise packs + Phase 25 `V1.4_SECURITY_REVIEW.md`

## Scope of this delta

UI chrome, navigation grouping, search presentation, help menu, tour copy/actions, documentation. **No auth, session, RBAC enforcement, or financial mutation APIs were redesigned.**

## Controls verified (carry-forward, not re-broken)

| Control | Status | Evidence |
|---------|--------|----------|
| Permission overrides (API + settings UI) | Present | `user_permission_overrides`, `SettingsUserPermissionOverrides.tsx` |
| BFF CSRF on `/api/wilms` | Present | Existing BFF proxy |
| Toast dedupe keys | Present | `uiStore` + notification tracker tests |
| Demo accounts blocked in prod | Operator/prod evidence in v1.3.8 cutover pack | Not re-run here |
| RBAC nav filtering | Present | `useFilteredNavItems` — grouping is display-only |

## Findings this pack

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| SEC-UX-01 | Info | Nav group labels are UI-only; backend remains authoritative | By design |
| SEC-UX-02 | Low | Help menu open state is client-only | Acceptable |
| SEC-UX-03 | Info | Search hides UUID-like subtitles from users | Hardening of disclosure |

## High / Critical open in this pack

None newly introduced.

## Deferred / operator-gated

- Live production smoke with real Super Admin credentials
- Dependency vulnerability scan refresh (see DEPENDENCY_REPORT)
