# P12 Gap Verification

Re-verified against the codebase on 2026-06-09. Baseline: `P11j-incomplete-work-audit.md`. P11aÔÇôP11j UI work was not reopened.

Legend: **Complete** = demo/mock end-to-end. **Partial** = wired but incomplete. **Missing** = not present. **Backend blocked** = requires real API/persistence.

---

## P11j carry-over items

| # | Feature | P11j status | P12 status | Frontend / backend | Evidence |
|---|---------|-------------|------------|-------------------|----------|
| 1 | Production REST API | Missing | **Missing** | Backend | `src/app/api/` still only `auth/login` and `auth/logout`. Service stubs call REST paths with no handlers. |
| 2 | Demo vs production switching | Partial | **Partial** | Backend (deploy) | `resolveDataProviderMode()` in `src/data-provider/types.ts`; production uses API only when `NEXT_PUBLIC_API_BASE_URL` is set in production build. |
| 3 | Group `displayName` editing | Partial | **Complete (demo)** | Frontend | `IGroupService.updateDisplayName`, `groupService.mock.ts`, `groupService.ts` stub, `GroupDisplayNameSection.tsx`. |
| 4 | Group `groupSystemId` UI | Missing | **Complete (demo)** | Frontend | Shown in `GroupDetailSections.tsx` and group profile header (`GroupProfilePanel.tsx`). |
| 5 | Leader permissions ÔÇö service enforcement | Partial | **Complete (demo)** | Frontend | `assertCanManageGroupLeader()` in `groupService.mock.ts` uses `canManageGroupLeader()` + actor role from `DEMO_ACCOUNTS` / settings users store. Tests in `groupService.mock.display-name.test.ts`. |
| 6 | Automated group formation ÔÇö production path | Partial | **Partial** | Backend | Mock path intact (`groupFormationService.mock.ts` ÔåÆ `group-formation.store.ts`). API stub in `groupFormationService.ts`; no `/groups/formation/*` routes. |
| 7 | Settings editable beyond min/max | Partial | **Partial** | Backend | `SettingsPanel.tsx` ÔÇö only min/max group size editable via `updateSettings`; other rows remain `readOnly` / `disabled`. |
| 8 | Collector messaging | Partial (stub) | **Partial (stub)** | Backend | `CollectorsManagementPanel.tsx` toast: demo messaging not enabled. |
| 9 | SMS / email delivery | Partial (UI) | **Partial (UI)** | Backend | Settings toggles disabled; `notificationService.mock.ts` in-app only. |
| 10 | GPS / location | Partial | **Partial** | Mixed | `locationService.mock.ts` demo coords; `locationService.ts` calls `/locations/*` (no route). Browser permission flow in registration wizard. |
| 11 | Offline payment sync | Partial | **Partial** | Backend | Offline queue + collector shell tested; sync targets mock/API payment endpoints without production API. |
| 12 | PWA install / SW caching | Partial | **Partial** | Frontend | `ServiceWorkerRegistrar`, manifest, `PwaInstallBanner`; no full offline route audit. |

---

## P12 additional fixes

| Item | Status | Evidence |
|------|--------|----------|
| Upload service domain | **Complete (demo + API stub)** | `IUploadService`, `uploadService.mock.ts`, `uploadService.ts`, wired in `MockDataProvider` / `ApiDataProvider` / `index.production.ts`. |
| Automated group profile lookup | **Complete (demo)** | `getGroupsDemoSourceById()` now resolves automated groups from `group-formation.store.ts`. |
| Formation queue visibility | **Complete (demo UI)** | `GroupFormationStatusSection.tsx` calls `groupFormationService.getCommunityStatus()`. |
| Display name persistence | **Complete (demo)** | `updateGroupSourceDisplayName()` in `groups-demo.factory.ts`; `updateAutomatedGroupDisplayName()` in `group-formation.store.ts`. |

---

## Summary

| Status | Count |
|--------|-------|
| Complete (demo-scope) | 6 items newly closed or confirmed (displayName, systemId UI, leader enforcement, upload service, automated group lookup, formation visibility) |
| Partial | 8 items (unchanged backend-dependent areas) |
| Missing (production API) | REST backend routes and persistence |

No P11 dashboard, KPI, export, print, navigation, or toolbar layouts were modified in P12.
