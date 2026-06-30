# P13 Upload Service UI Integration Report

Audit date: 2026-06-09. Service layer established in P12 (`IUploadService`, mock, API stub). P13 wires selected UI flows.

---

## Service layer (unchanged infrastructure)

| Layer | File | Endpoints / behavior |
|-------|------|----------------------|
| Interface | `src/types/services.ts` — `IUploadService` | `uploadFile`, `getUpload`, `deleteUpload` |
| DTOs | `src/types/upload.ts` | `UploadFileInput`, `UploadRecord`, `UPLOAD_PURPOSE` |
| API provider | `src/services/uploadService.ts` | `POST /uploads`, `GET /uploads/:id`, `POST /uploads/:id/delete` |
| Mock provider | `src/services/mock/uploadService.mock.ts` | In-memory store; returns data URL when `dataUrl` provided |
| Provider wiring | `MockDataProvider.ts` L54, `ApiDataProvider.ts` | Both expose `uploadService` |

---

## P13 UI integration utility

`src/utils/upload-file.ts`:

- `fileToDataUrl(file)` — FileReader base64
- `uploadFileViaService({ file, purpose, entityId })` — calls `uploadService.uploadFile`
- `deleteUploadedFile(uploadId)` — calls `uploadService.deleteUpload`

Tests: `src/tests/utils/upload-file.test.ts` (3 tests, passing).

---

## `PhotoUpload` component wiring

`src/components/forms/PhotoUpload.tsx` — new props:

| Prop | Purpose |
|------|---------|
| `uploadPurpose` | Maps to `UPLOAD_PURPOSE` |
| `entityId` | Optional entity association |
| `onUploadRecordChange` | Callback with `UploadRecord` after upload |

Behavior (verified in source):

1. **Upload** — on file select, calls `uploadFileViaService` when `uploadPurpose` set
2. **Replace** — new file triggers new upload; prior upload deleted via `deleteUploadedFile`
3. **Delete** — remove button calls `deleteUploadedFile(uploadRecord.id)` and clears preview
4. **Preview** — `URL.createObjectURL` for local file + `UploadRecord.url` from service

`PhotoUploadField.tsx` passes through upload props to `PhotoUpload`.

---

## Workflow coverage

| Workflow | Wired to `IUploadService`? | Purpose | Evidence |
|----------|---------------------------|---------|----------|
| User profile photo | **Yes** | `PROFILE_PHOTO` | `RoleSettingsPanel.tsx` L62–66 |
| Borrower photo (registration) | **Yes** | `BORROWER_PHOTO` | `BorrowerRegistrationWizard.tsx` L779–782 |
| Guarantor photo (registration) | **Yes** | `GUARANTOR_PHOTO` | `BorrowerRegistrationWizard.tsx` L743 |
| Registration attachments | **No** | `REGISTRATION_ATTACHMENT` | No UI references to `UPLOAD_PURPOSE.REGISTRATION_ATTACHMENT` |
| Supporting documents | **No** | `DOCUMENT` | Expense form uses text `receiptFileName` only (`CollectorExpenseForm.tsx`) |
| Signature capture | **No** | `UPLOAD_SIGNATURES` permission exists; no upload wiring | Registration uses separate signature fields |

Registration payload stores upload IDs:

- `registration.schema.ts` — `photoUploadId`, `guarantorPhotoUploadId` optional fields
- `registration.utils.ts` — passes IDs into `RegisterBorrowerPayload`
- `types/borrower-registration.ts` — payload type includes upload IDs

---

## Demo mode verification

| Operation | Mock behavior | Evidence |
|-----------|---------------|----------|
| Upload | Stores record in `upload.store.ts`; URL is data URL or `/uploads/...` path | `uploadService.mock.ts` L22–42 |
| Get | Reads from store | `uploadService.mock.ts` L45–47 |
| Delete | Removes from store; throws if missing | `uploadService.mock.ts` L50–55 |
| Unit tests | 3 passing | `uploadService.mock.test.ts` |

Demo mode continues to work: `MockDataProvider` selects mock upload service; `PhotoUpload` uses `@/services` barrel which resolves to mock in development.

---

## API mode readiness

API stub exists (`uploadService.ts`). Current UI sends `dataUrl` in JSON body per `UploadFileInput` — backend handoff note: production API may require multipart upload instead of base64; interface comment in `types/upload.ts` L16 acknowledges this.

---

## Remaining gaps

1. **List/profile views** do not call `uploadService.getUpload(photoUploadId)` to resolve photos — see `P13-photo-completion-report.md`.
2. **Registration attachments** (ID scans, agreements) — not connected.
3. **Expense receipts** — filename text field only, not file upload.
4. **Borrower profile edit** — no standalone borrower photo replace outside registration wizard.

---

## Summary

| Capability | Status |
|------------|--------|
| Upload | Working for profile + registration photos (mock verified) |
| Replace | Working via PhotoUpload re-select |
| Delete | Working via PhotoUpload remove |
| Preview | Working (local object URL + service URL) |
| Document/attachment flows | Not integrated |
