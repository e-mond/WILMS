# P13 Photo Render Audit

Audit date: 2026-06-15.

Utility chain:

1. `resolveMockPhotoUrl()` — mock layer resolves `photoUploadId` via `upload.store`
2. DTOs expose `photoUrl` (or `subjectPhotoUrl`, `actorPhotoUrl`)
3. UI calls `resolveEntityPhotoUrl({ name, id, photoUrl, photoFileName })` → `resolvePersonPhotoUrl()` prefers `uploadUrl` before Dicebear

---

## Surface audit

| Surface | Uses `resolveEntityPhotoUrl` / upload URL? | Evidence |
|---------|---------------------------------------------|----------|
| Borrower list | Yes — `row.photoUrl` | `BorrowerList.tsx`; mock sets `photoUrl` in `borrowerService.mock.ts` |
| My registrations | Yes — `row.photoUrl` | `MyRegistrationsList.tsx` |
| Group members | Yes — `row.photoUrl` | `GroupMembersSection.tsx`; `group-members.resolver.ts` enriches members |
| Group leader/collector | Partial — still `resolvePersonPhotoUrl` only | `GroupDetailSections.tsx` — no `photoUrl` on leader DTO yet; Dicebear fallback |
| Collectors list/aside | Partial — `CollectorSummary.photoUrl` added in factory; UI files not all updated | `collectors-demo.factory.ts` adds `photoUrl`; `CollectorsAsidePanel.tsx` still uses name/id only |
| Settings users | Partial — type has `photoUrl`; UI not yet passing it | `SettingsUserRecord.photoUrl`; `SettingsUsersSection.tsx` unchanged |
| Notifications | Yes — `subjectPhotoUrl` | `NotificationInboxPanel.tsx`; seed items in `notificationService.mock.ts` |
| Audit log | Yes — `actorPhotoUrl` | `AuditLogReportPanel.tsx`; `audit-log.store.ts` sets on create |
| Search results | Yes — `result.photoUrl` via mock | `GlobalSearchPanel.tsx`; `searchService.mock.ts` uses `resolveMockPhotoUrl` |
| Approval review | Yes — `photoUrl`, `guarantorPhotoUrl` | `BorrowerReviewProfile.tsx`; mock review builder |
| Registration wizard preview | Yes (local preview) | `PhotoUpload` preview URL |
| Payment history / collector dashboard | Pre-existing — `borrowerPhotoUrl` from utils | `collector-dashboard.utils.ts` |
| Borrower profile panel | Partial — no `photoUrl` on `BorrowerFullProfile` | Still Dicebear via name/id |

---

## Mock photo resolution

New file: `src/services/mock/photo-url.resolver.ts`

```ts
resolveMockPhotoUrl({ photoUrl?, photoUploadId?, photoFileName?, name, id })
```

Used by: `borrowerService.mock.ts`, `searchService.mock.ts`, `group-members.resolver.ts`, `audit-log.store.ts`, notification seeds.

Registration payload stores `photoUploadId` / `guarantorPhotoUploadId` in profile via `borrower-profile.ts`.

---

## Verified fixes applied

- `src/utils/entity-photo.ts` — `resolveEntityPhotoUrl()` wrapper
- Types extended: `BorrowerSummary.photoUrl`, `OfficerRegistrationSummary.photoUrl`, `BorrowerReviewDetail.photoUrl/guarantorPhotoUrl`, `NotificationInboxItem.subjectPhotoUrl`, `AuditEntry.actorPhotoUrl`, `GroupMember.photoUrl`, `CollectorSummary.photoUrl`, `SettingsUserRecord.photoUrl`

---

## Remaining gaps (verified)

| Gap | Impact |
|-----|--------|
| `BorrowerProfilePanel`, `GroupDetailSections`, collector UI components | Still omit `photoUrl` prop — Dicebear fallback only |
| `SettingsUsersSection` | Does not pass `row.photoUrl` |
| API mode | Requires backend to return `photoUrl` on entity DTOs |
| Uploaded photos before registration complete | Visible in wizard preview and after mock registry stores upload IDs |

---

## Fallback behavior

When `photoUrl` and `photoUploadId` are absent, `resolvePersonPhotoUrl()` uses Dicebear SVG — verified unchanged in `src/utils/person-photo.ts`.
