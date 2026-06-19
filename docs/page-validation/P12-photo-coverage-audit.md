# P12 Profile Photo Coverage Audit

Audit date: 2026-06-09. Avatar implementation: `src/components/data-display/Avatar.tsx` with `resolvePersonPhotoUrl()` (`src/utils/person-photo.ts`) — Dicebear SVG seeds from name/id; initials fallback when image fails.

Upload service (`IUploadService`) exists but is **not yet wired** to replace Dicebear URLs in list/profile surfaces.

---

## Surface audit

| Surface | Avatar / photo | Evidence | Gap |
|---------|----------------|----------|-----|
| **Search results** | Yes | `GlobalSearchPanel.tsx` renders `Avatar` with `result.photoUrl` from `searchService.mock.ts` (`resolvePersonPhotoUrl`) | Uses generated avatars, not uploaded photos |
| **Notifications** | **No** | `NotificationInboxPanel.tsx` — text-only list, severity badges | No avatar column |
| **Group members** | Yes | `GroupMembersSection.tsx` — `resolvePersonPhotoUrl({ name, id: borrowerId })` | Generated only |
| **Borrower lists** | **No** | `BorrowerList.tsx` — no `Avatar` import | List rows lack photos |
| **Collector lists** | Yes | `CollectorsManagementPanel.tsx`, `CollectorsMobileCardList.tsx` | Generated only |
| **User management** | Yes | `SettingsUsersSection.tsx`, `SettingsUserProfileModal.tsx` | Generated only |
| **Registration review (officer)** | Yes | `MyRegistrationsList.tsx` | Generated only |
| **Approval review** | Yes | `BorrowerReviewProfile.tsx` — borrower + guarantor avatars | Generated only |
| **Payment history / collections** | Yes | `CollectorDashboardPanel.tsx`, `GroupCollectionSheet.tsx`, `collector-dashboard.utils.ts` | Generated only |
| **Audit records** | **No** | `AuditLogReportPanel.tsx` — actor name text only | No actor avatars |
| **Group leader / collector on profile** | Yes | `GroupDetailSections.tsx` | Generated only |
| **Borrower profile** | Yes | `BorrowerProfilePanel.tsx` | Generated only |
| **Shell user panel** | Yes | `ShellUserPanel.tsx`, `UserProfileMenu.tsx` | Generated only |
| **Risk flags aside** | Yes | `RiskFlagsAsidePanel.tsx` | Generated only |

---

## Fallback behaviour

| Check | Status | Evidence |
|-------|--------|----------|
| Initials when no photo URL | Yes | `Avatar.tsx` derives initials from `label` |
| Broken image fallback | Yes | `Avatar.tsx` `onError` → initials display |
| Empty label handling | Yes | Avatar renders initials or placeholder |

---

## Remaining gaps

1. **Borrower list table** — no avatars in admin borrower directory
2. **Notification inbox** — no person/group avatars on notification rows
3. **Audit log report** — no actor avatars
4. **Real uploaded photos** — `IUploadService` not consumed by UI; all surfaces use Dicebear seeds until integration

Avatar **fallback** works everywhere `Avatar` is used. Gaps are **missing Avatar usage** on three surfaces and **upload URL integration** globally.
