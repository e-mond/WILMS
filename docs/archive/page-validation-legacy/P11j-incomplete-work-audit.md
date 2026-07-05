# P11j Incomplete Work Audit

Audit method: Direct codebase inspection (2026-06-15). Prior phase completion docs were **not** used as source of truth.

Legend: **Complete** = wired end-to-end in demo/mock mode. **Partial** = UI or types exist but not fully wired. **Missing** = specified behaviour not present in code.

---

## 1. Production REST API backend

| Field | Value |
|-------|-------|
| Feature | All `apiClient` service methods (borrowers, loans, groups, reports, settings, etc.) |
| Status | **Missing** (API layer stubs only) |
| Evidence | `src/app/api/` contains only `auth/login` and `auth/logout`. All other services call REST paths via `src/services/*.ts` with no matching route handlers. |
| Missing | Backend routes, controllers, persistence |
| Effort | Large (multi-sprint) |
| Blocked by backend? | **Yes** |

---

## 2. Demo vs production service switching

| Field | Value |
|-------|-------|
| Feature | Production data provider |
| Status | **Partial** |
| Evidence | `next.config.mjs` aliases `@/services` to mocks when `NEXT_PUBLIC_API_BASE_URL` is unset or non-production. Default demo uses `MockDataProvider`. |
| Missing | Deployed API + env configuration for production mode |
| Effort | Small (config) once API exists |
| Blocked by backend? | **Yes** |

---

## 3. Group `displayName` editing

| Field | Value |
|-------|-------|
| Feature | Editable group display name (immutable `groupSystemId`) |
| Status | **Partial** |
| Evidence | `groupSystemId` / `displayName` on `GroupSummary` (`src/types/group.ts`); populated in `enrichGroupSummary` and formation store. No group profile UI reads or edits `displayName`. |
| Missing | Group profile field + service method to update display name |
| Effort | SmallÔÇômedium |
| Blocked by backend? | **No** (mock store can persist) |

---

## 4. Group `groupSystemId` visibility

| Field | Value |
|-------|-------|
| Feature | Show immutable system ID in group UI |
| Status | **Missing** in UI |
| Evidence | Grep under `src/features/group-management/` finds no `groupSystemId` usage in components. |
| Missing | Display in group header/aside |
| Effort | Small |
| Blocked by backend? | **No** |

---

## 5. Group leader permissions ÔÇö service enforcement

| Field | Value |
|-------|-------|
| Feature | Approver / Collector / Super Admin leader rules |
| Status | **Partial** |
| Evidence | `canManageGroupLeader()` gates button in `GroupMembershipManagement.tsx`. `groupService.mock.ts` `replaceLeader()` has **no** role checks. |
| Missing | Service-layer authorization on replace/assign leader |
| Effort | Small |
| Blocked by backend? | **No** (mock); **Yes** for real API auth |

---

## 6. Automated group formation ÔÇö production path

| Field | Value |
|-------|-------|
| Feature | Auto-create groups at approval threshold |
| Status | **Partial** |
| Evidence | Fully wired in mock: `borrowerService.mock.ts` ÔåÆ `groupFormationService.mock.ts` ÔåÆ `group-formation.store.ts`. API: `groupFormationService.ts` posts to `/groups/formation/*` (no route). |
| Missing | API routes + persistence |
| Effort | Medium |
| Blocked by backend? | **Yes** for production |

---

## 7. Settings ÔÇö editable configuration

| Field | Value |
|-------|-------|
| Feature | Super Admin system settings |
| Status | **Partial** |
| Evidence | Only `minGroupSize` / `maxGroupSize` editable via `SettingsPanel` ÔåÆ `updateSettings`. Security, SMS, notifications, loan caps, integrations remain `readOnly` / `disabled`. |
| Missing | Broader settings CRUD + API |
| Effort | Medium per section |
| Blocked by backend? | **Yes** for production persistence |

---

## 8. In-app collector messaging

| Field | Value |
|-------|-------|
| Feature | Message collector from management panel |
| Status | **Partial (stub)** |
| Evidence | `CollectorsManagementPanel.tsx` `onMessage` shows toast: "In-app messaging is not enabled in demo." |
| Missing | Messaging service + UI |
| Effort | Medium |
| Blocked by backend? | **Yes** |

---

## 9. SMS / email delivery

| Field | Value |
|-------|-------|
| Feature | Outbound SMS/email from settings triggers |
| Status | **Partial (UI only)** |
| Evidence | Settings toggles disabled; `notificationService.mock.ts` simulates in-app notifications only. |
| Missing | Provider integration |
| Effort | Large |
| Blocked by backend? | **Yes** |

---

## 10. GPS / location on real devices

| Field | Value |
|-------|-------|
| Feature | Live geolocation in registration |
| Status | **Partial** |
| Evidence | `locationService.mock.ts` returns demo coordinates; real `locationService.ts` calls `/locations/*` (no API). Browser permission flow exists in wizard. |
| Missing | Backend location endpoints + production geolocation policy |
| Effort | Medium |
| Blocked by backend? | **Yes** for API; partial **No** for browser-only GPS |

---

## 11. Offline payment sync to server

| Field | Value |
|-------|-------|
| Feature | Queue payments offline, sync when online |
| Status | **Partial** |
| Evidence | `offlineQueueStore`, `CollectorOfflineShell`, background sync helpers tested. Sync targets mock/API payment endpoints. |
| Missing | Production API acceptance + conflict handling |
| Effort | Medium |
| Blocked by backend? | **Yes** |

---

## 12. PWA install / service worker caching

| Field | Value |
|-------|-------|
| Feature | PWA offline shell |
| Status | **Partial** |
| Evidence | `ServiceWorkerRegistrar`, `manifest.webmanifest`, `PwaInstallBanner`. SW registers; no custom fetch/cache strategy audited for all routes. |
| Missing | Full offline route coverage validation on devices |
| Effort | Medium |
| Blocked by backend? | **No** |

---

## Summary counts

| Status | Count |
|--------|-------|
| Complete (demo-scope) | Core UI flows, mock services, auth demo, exports/print |
| Partial | 10 items above |
| Missing (production) | REST API backend |

No features were marked complete without code evidence. Demo-mode functionality is intentionally mock-driven per `MockDataProvider` and `isDemoMode()`.
