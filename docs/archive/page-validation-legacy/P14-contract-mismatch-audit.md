# P14 Contract Mismatch Audit

**Date:** 2026-06-09  
**Method:** Compared `src/types/services.ts`, `src/services/*Service.ts`, mock implementations, and new `backend/` routes before coding.

## Resolved in P14

| Mismatch | Evidence | Resolution |
|----------|----------|------------|
| API success shape flat JSON vs envelope | New backend `sendData()` uses `{ data: T }` | `apiClient.ts` unwraps `data` (integration-only) |
| API error shape | Backend uses `{ error: { message, code } }` | `apiClient.ts` reads nested `error` |
| `deleteRegistration` stub arity | Interface `IBorrowerService.deleteRegistration(id, officerId)` vs stub with zero args (`borrowerService.ts:83-86`) | Stub fixed; backend `DELETE /borrowers/:id/registration?officerId=` |
| Session cookie not sent cross-origin to `:4000` | Browser cookie scoped to Next origin | BFF proxy `src/app/api/wilms/[...path]/route.ts` forwards `Authorization: Bearer <wilms_session>` |
| Remote login response | `authenticate.ts` expected `{ userId, role, expiresAt }` | Backend returns both flat session fields and `user` object inside envelope |

## Documented ÔÇö Not Yet Aligned

| Mismatch | Frontend evidence | Backend / follow-up |
|----------|-------------------|---------------------|
| Upload multipart | `UploadFileInput.dataUrl` mock-only (`types/upload.ts:18`) | Backend accepts `dataUrl` JSON for P14; multipart deferred |
| `simulatePhoneCapture` | API stub rejects (`photoCaptureSessionService.ts:13-14`) | Not implemented ÔÇö demo-only per contract map |
| `authService.login` always hits Next route | `authService.ts:7` uses `/api/auth/login` | Correct for cookie issuance; backend `/auth/login` used server-side via `authenticate.ts` |
| Offline queue batch sync | No API contract | Individual `POST /payments` only |
| 15+ service domains | Stubs exist, no backend module yet | Loans, settings, notifications, search, collectors, risk flags, etc. ÔÇö P14.1+ |
| `getBorrowerFullProfile` | Rich mock with loans/progress | Backend returns `{ ...detail, loans: [], progress: null }` placeholder |
| `checkGuarantorEligibility` | Full mock logic | Backend returns `{ eligible: true, reasons: [] }` stub |
| Reviewed applications DTO | Mock includes richer fields | Backend minimal `{ decision, reviewedAt, reason }` |

## Provider mapping verification

| Domain | Interface | Mock | API stub path | Backend route (P14) |
|--------|-----------|------|---------------|---------------------|
| Auth | `IAuthService` | mock credentials | N/A (Next route) | `POST /auth/login` |
| Upload | `IUploadService` | `upload.store.ts` | `/uploads` | Ô£à |
| Borrowers | `IBorrowerService` | `borrowerService.mock.ts` | `/borrowers/*` | Ô£à partial |
| Group formation | `IGroupFormationService` | `groupFormationService.mock.ts` | `/groups/formation/*` | Ô£à |
| Payments | `IPaymentService` | `paymentService.mock.ts` | `/payments` | Ô£à partial |
| Audit | `IAuditService` | `auditService.mock.ts` | `/audit`, `/audit-log` | Ô£à |
| Reports | `IReportService` | `reportService.mock.ts` | `/reports/*` | Ô£à hub + daily collection |

No UI layout or workflow changes required for mismatches marked resolved.
