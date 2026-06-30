# P13 Upload Completion Report

Audit date: 2026-06-15.

---

## Service layer (unchanged)

| Layer | Path |
|-------|------|
| Interface | `src/types/services.ts` — `IUploadService` |
| Mock | `src/services/mock/uploadService.mock.ts` |
| API stub | `src/services/uploadService.ts` |
| Utility | `src/utils/upload-file.ts` |

---

## Completed in this follow-up

### Registration attachments

| Item | Evidence |
|------|----------|
| UI component | `src/components/forms/DocumentUpload.tsx` — upload, preview, replace, delete |
| Registration wizard | `BorrowerRegistrationWizard.tsx` step 0 — `DocumentUpload` with `UPLOAD_PURPOSE.REGISTRATION_ATTACHMENT` |
| Schema | `registration.schema.ts` — `idDocument`, `idDocumentUploadId` |
| Payload | `registration.utils.ts`, `RegisterBorrowerPayload.idDocumentUploadId` |
| Export | `components/forms/index.ts` exports `DocumentUpload` |

### Expense receipts

| Item | Evidence |
|------|----------|
| Form | `CollectorExpenseForm.tsx` — `DocumentUpload` with `UPLOAD_PURPOSE.DOCUMENT` |
| Payload | `CreateExpenseInput.receiptUploadId` in `types/expense.ts` |
| Removed | Text-only `receiptFileName` input replaced by file upload UI |

---

## Previously completed (P13 baseline)

| Workflow | Purpose | File |
|----------|---------|------|
| User profile photo | `PROFILE_PHOTO` | `RoleSettingsPanel.tsx` |
| Borrower photo | `BORROWER_PHOTO` | `BorrowerRegistrationWizard.tsx` |
| Guarantor photo | `GUARANTOR_PHOTO` | `BorrowerRegistrationWizard.tsx` |

All use `PhotoUpload` → `uploadFileViaService` → `IUploadService`.

---

## Operations matrix

| Operation | PhotoUpload | DocumentUpload | Mock verified |
|-----------|-------------|----------------|---------------|
| Upload | Yes | Yes | `uploadService.mock.test.ts` |
| Replace | Yes (re-select) | Yes (Replace file) | Same |
| Delete | Yes (Remove) | Yes (Remove) | Same |
| Preview | Yes (object URL / service URL) | Yes (image preview or filename) | Same |

---

## Remaining gaps

| Gap | Notes |
|-----|-------|
| Signature fields | Still canvas/data-URL in `IdentityCaptureField` / `SignaturePad`; not uploaded via `IUploadService` (uses `UPLOAD_SIGNATURES` permission ID only) |
| Backend multipart | API still accepts `dataUrl` in JSON per `UploadFileInput` comment |
| List views | Upload URLs resolved via mock `photoUrl` on DTOs — see `P13-photo-render-audit.md` |

---

## Demo mode

`MockDataProvider` wires `uploadServiceMock`. Registration and expense flows call `@/services` barrel — demo mode verified by unit tests (400 passing).
