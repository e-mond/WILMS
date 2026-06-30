# P13 Profile Photo Coverage Report

Audit date: 2026-06-09. Baseline: `context/page-validation/P12-photo-coverage-audit.md`.

Shared utility: `resolvePersonPhotoUrl()` in `src/utils/person-photo.ts` — prefers `uploadUrl` when provided, otherwise Dicebear SVG via seed from `photoFileName ?? id ?? name`.

Avatar component: `src/components/data-display/Avatar.tsx` — renders `photoUrl` image or initials from `label`.

---

## Required surfaces (P13 task list)

| Surface | P12 status | P13 status | Evidence |
|---------|------------|------------|----------|
| Borrower list rows | Missing | **Implemented** | `BorrowerList.tsx` L211–216 — `Avatar` + `resolvePersonPhotoUrl({ name, id })` |
| Notification lists | Missing | **Implemented** | `NotificationInboxPanel.tsx` L147–156 — avatar when `subjectName` present |
| Audit log entries | Missing | **Implemented** | `AuditLogReportPanel.tsx` L188–194 — actor column with `Avatar` |
| Search result cards | Present (P12) | **Unchanged** | `GlobalSearchPanel.tsx` L102 — `Avatar` with `result.photoUrl` |
| Group member views | Present (P12) | **Unchanged** | `GroupMembersSection.tsx` L94–96 |
| Payment history records | Present (P12) | **Unchanged** | `collector-dashboard.utils.ts` L110, L252; `GroupCollectionSheet.tsx` L107–109 |

---

## P13 code changes

### Borrower list

```211:216:src/features/borrower-management/components/BorrowerList.tsx
                    <Avatar
                      label={row.fullName}
                      photoUrl={resolvePersonPhotoUrl({ name: row.fullName, id: row.id })}
                      size="sm"
                    />
```

### Notification inbox

Type extended with optional subject fields:

- `src/types/notification.ts` — `subjectName?`, `subjectId?` on `NotificationInboxItem`
- `src/services/mock/notificationService.mock.ts` — seed items include subject fields

```147:156:src/components/layout/shell/navbar/NotificationInboxPanel.tsx
                        {item.subjectName ? (
                          <Avatar
                            label={item.subjectName}
                            photoUrl={resolvePersonPhotoUrl({
                              name: item.subjectName,
                              id: item.subjectId,
                            })}
                            size="sm"
                          />
                        ) : null}
```

### Audit log report

```188:194:src/features/reports/components/AuditLogReportPanel.tsx
                    <Avatar
                      label={label}
                      photoUrl={resolvePersonPhotoUrl({ name: label, id: entry.actorId })}
                      size="sm"
                    />
```

### `resolvePersonPhotoUrl` upload support

```11:23:src/utils/person-photo.ts
export function resolvePersonPhotoUrl({
  name,
  id,
  photoFileName,
  uploadUrl,
}: PersonPhotoOptions): string {
  if (uploadUrl?.trim()) {
    return uploadUrl;
  }
  const seed = encodeURIComponent(photoFileName ?? id ?? name);
  return `${DICEBEAR_BASE}?seed=${seed}&backgroundColor=e8f5f0,f0f4f8&backgroundType=gradientLinear`;
}
```

---

## Other surfaces already using avatars (not modified in P13)

| Surface | File |
|---------|------|
| Borrower profile | `BorrowerProfilePanel.tsx` |
| Approval review | `BorrowerReviewProfile.tsx` |
| My registrations | `MyRegistrationsList.tsx` L233–235 |
| Settings users | `SettingsUsersSection.tsx`, `SettingsUserProfileModal.tsx` |
| Group leader/collector | `GroupDetailSections.tsx` |
| Collectors aside | `CollectorsAsidePanel.tsx` |
| Risk flags aside | `RiskFlagsAsidePanel.tsx` |
| Settings activity | `SettingsAsidePanel.tsx` |
| Search mock data | `searchService.mock.ts` L66 |

---

## Uploaded photo vs fallback behavior

| Context | Uses uploaded photo URL? | Evidence |
|---------|--------------------------|----------|
| PhotoUpload preview (after upload) | Yes | `PhotoUpload.tsx` — mock returns data URL in `UploadRecord.url` |
| Role settings profile upload | Yes (preview only) | `RoleSettingsPanel.tsx` — `PhotoUpload` with `PROFILE_PHOTO` |
| Registration wizard photos | Yes (preview + stores `photoUploadId`) | `BorrowerRegistrationWizard.tsx` L743, L779 |
| List/table/search views | **No — Dicebear fallback only** | All list usages pass `{ name, id }` without `uploadUrl`; no `getUpload()` lookup in list builders |
| Search results | Dicebear via mock | `searchService.mock.ts` uses `resolvePersonPhotoUrl({ name, id })` |

**Gap:** `uploadUrl` parameter exists but is not wired from `photoUploadId` / stored upload records into borrower list, notifications, or audit views. Users see consistent initials/Dicebear avatars until backend provides photo URLs on entity DTOs.

---

## Fallback initials

`Avatar.tsx` renders initials from `label` when `photoUrl` fails or is absent — verified by existing unit tests under `src/tests/components/`.

---

## Summary

| Metric | Result |
|--------|--------|
| Six required surfaces have `Avatar` + `resolvePersonPhotoUrl` | **6/6** |
| P13 newly implemented surfaces | 3 (borrower list, notifications, audit log) |
| Uploaded photo displayed outside upload preview | **Not implemented** — requires DTO `photoUrl` or upload ID resolution in list builders |
