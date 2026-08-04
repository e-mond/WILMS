# Frontend Audit Report — v1.3.6-rc1

**Date:** 2026-07-12

---

## Files changed

| File | Change |
|------|--------|
| `role-settings-sections.ts` | Removed duplicate PIN for collector |
| `RoleSettingsPanel.tsx` | Removed PIN render branch |
| `collector/security/page.tsx` | Redirect to settings |
| `AppLockNavbarButton.tsx` | Link to `/collector/settings` |
| `UserProfileMenu.tsx` | Link to `/collector/settings` |
| `CollectorsAsidePanel.tsx` | Display id formatting |
| `CollectorsManagementPanel.tsx` | Message modal error handling |
| `next.config.mjs` | Production mock guard |

## Dead code

| Item | Recommendation |
|------|----------------|
| `ROLE_SETTINGS_SECTION.PIN` constant | Keep — unused in nav; safe for future removal in cleanup pass |

## Console / hydration

No new hydration patterns introduced. Security page uses server `redirect()`.

## Tests

Frontend unit: **233/233 PASS**  
Lint: **0 errors**

## Navigation

`/collector/security` → `/collector/settings` (legacy URLs preserved via redirect).

## Large components

No refactors — stabilisation only per RC rules.
