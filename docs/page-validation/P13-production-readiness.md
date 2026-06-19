# P13 Production Readiness Report

Audit date: 2026-06-09. Scope: P13 production-readiness gaps from P12 audits only. P11/P12 completed work not reopened.

Validation run in P13:

| Check | Result | Evidence |
|-------|--------|----------|
| `npm run test` | **400 passed** | 2 shards × 200 tests, exit code 0 |
| `npm run build` | **Success** | Next.js 14.2.18, 42 static routes |
| `npm run test:e2e` | **Not run** | See `P13-e2e-expansion-report.md` |

---

## A. Completed P13 work

### 1. RBAC rollout completion

- Extended `PermissionGate` to **16 consumer files** (from 2 in P12)
- Centralized export/print gating in `WilmsExportActions.tsx` and `ExportCsvButton.tsx` via `permissions` prop (default `EXPORT_REPORTS`)
- Wizard submit gating via `MultiStepForm.submitPermissions` for registration and create-loan flows
- Domain gates: collections, expenses, risk flags, groups, approval, settings users
- `PermissionGate` test-safe via `useOptionalPermissionContext()` when outside provider

Report: `P13-rbac-rollout-report.md`

### 2. Profile photo coverage

- Added avatars to borrower list, notification inbox, audit log actor column
- Extended `NotificationInboxItem` with `subjectName` / `subjectId`
- Added `uploadUrl` parameter to `resolvePersonPhotoUrl()` (not yet consumed in list views)

Report: `P13-photo-completion-report.md`

### 3. Upload service UI integration

- New `src/utils/upload-file.ts` helper
- `PhotoUpload` wired to `IUploadService` (upload, replace, delete, preview)
- Profile photo (`RoleSettingsPanel`), borrower/guarantor photos (`BorrowerRegistrationWizard`)
- Registration payload stores `photoUploadId` / `guarantorPhotoUploadId`
- Unit tests: `upload-file.test.ts`, `uploadService.mock.test.ts`

Report: `P13-upload-integration-report.md`

### 4. E2E expansion

- New `e2e/p13-workflows.spec.ts` — 8 workflow smoke tests
- Fixed `e2e/role-journeys.spec.ts` mobile nav assertion

Report: `P13-e2e-expansion-report.md`

### 5. API contract map

- Documented 23 service domains with interfaces, providers, endpoints, DTOs

Report: `P13-api-contract-map.md`

### 6. Notification & audit review

- Documented mock pipeline, producers, UI wiring, backend gaps

Report: `P13-notification-audit-review.md`

---

## B. Remaining frontend gaps

| Gap | Evidence |
|-----|----------|
| Assign Group / Assign Collector buttons ungated | `PendingApplicationReview.tsx` L329–419 |
| Create loan `<Link>` ungated | `LoanPortfolioList.tsx` L104–109, L200–205 |
| Delete registration ungated | `MyRegistrationsList.tsx` L114–126 |
| Role clone/delete ungated | `SettingsRolesSection.tsx` L65–81 |
| Payment edit ungated | `PaymentEditSection.tsx` — no `PermissionGate` |
| Adjustment approve/reject ungated | No `PermissionGate` in `src/features/adjustments/` |
| Uploaded photos not shown in lists | List views omit `uploadUrl` in `resolvePersonPhotoUrl` calls |
| Registration attachments not uploaded | No `REGISTRATION_ATTACHMENT` UI usage |
| Expense receipts — text filename only | `CollectorExpenseForm.tsx` |
| E2E mutation tests absent | `p13-workflows.spec.ts` — page-load smoke only |
| Playwright suite not executed in P13 | No CI log in session |

---

## C. Backend blockers

| Blocker | Impact |
|---------|--------|
| No API server implementing stub endpoints | `ApiDataProvider` cannot serve production |
| `deleteRegistration` API rejects | Demo-only feature (`borrowerService.ts` L83–86) |
| `simulatePhoneCapture` API rejects | Phone capture demo-only |
| Upload contract uses base64 `dataUrl` | Backend needs multipart + CDN URLs |
| Entity DTOs lack `photoUrl` / upload resolution | Lists fall back to Dicebear avatars |
| Notification/audit persistence | Mock in-memory only |
| Auth via `/api/auth/login` Next route | Real identity provider not integrated |

Full endpoint list: `P13-api-contract-map.md`

---

## D. Upload readiness

| Item | Status |
|------|--------|
| `IUploadService` interface | Complete |
| Mock provider | Complete + tested |
| API stub | Complete (3 endpoints) |
| Profile photo UI | Wired |
| Borrower/guarantor photo UI | Wired |
| Document/attachment UI | **Not wired** |
| List view photo resolution | **Not wired** |
| Demo mode | **Working** |

Score: **3/5 workflows integrated** (profile, borrower, guarantor). Operations (upload/replace/delete/preview): **4/4** in wired flows.

---

## E. RBAC readiness

| Layer | Status |
|-------|--------|
| Portal route guards | Complete (5 portals) |
| Path permission matrix | Complete (`permission-matrix.ts`) |
| Nav item filtering | Complete (`NAV_ITEM_PERMISSIONS`) |
| Export/print action gates | Complete (centralized) |
| Wizard submit gates | Complete (registration, create loan) |
| Fine-grained action gates | **Partial** — 7 verified gaps (see Section B) |

Requested action types (11): Create, Edit, Delete, Approve, Reject, Export, Print, Assign, Suspend, Reset PIN, Reset Password.

Component-level gates verified for: Create (×2), Approve, Reject, Export, Print, Suspend, Reset PIN, Reset Password, partial Assign (group membership).

**Gaps:** Edit, Delete, Assign (approval workflow), Create loan nav link.

Score: **9/11** requested action types have component gates (Assign counted partial).

---

## F. E2E readiness

| Area | Smoke test | Mutation test |
|------|------------|---------------|
| Login / logout / app lock | Yes | Partial |
| Registration | Yes (P13) | No |
| Approval | Yes (P13) | No |
| Groups | Yes (P13) | No |
| Collections | Yes (P13) | No |
| Expenses | Yes (P13) | No |
| Reports | Yes (P13) | No |
| User management | Yes (P13) | No |
| Search | Yes (P13) | No |

Score: **8/8** workflow areas have smoke coverage. **0/8** have mutation coverage. Playwright not executed in P13 validation.

---

## G. API readiness

| Metric | Count |
|--------|-------|
| Service interfaces in `types/services.ts` | 23 domains |
| Mock providers | 23 (auth uses shared impl + mock login) |
| API provider files | 23 |
| Documented endpoints | See `P13-api-contract-map.md` |
| Mock-only methods | 2 (`deleteRegistration`, `simulatePhoneCapture`) |

Frontend is **API-contract ready** — stubs exist for backend swap via `ApiDataProvider`. No backend implementation verified.

---

## H. Production readiness score

Scoring method: verified checklist ratios per category (see sub-reports). No projected timelines.

| Category | Verified ratio | Score |
|----------|----------------|-------|
| RBAC action gates (11 requested types) | 9/11 | 82% |
| Avatar surfaces (6 required) | 6/6 | 100% |
| Upload workflows (5 requested) | 3/5 | 60% |
| E2E smoke (8 workflow areas) | 8/8 | 100% |
| E2E mutation depth (8 areas) | 0/8 | 0% |
| API contract coverage (23 domains documented) | 23/23 | 100% |
| Demo pipeline (notification + audit) | Functional in mock | 100% |
| Backend implementation | 0 endpoints live | 0% |

**Composite frontend demo readiness:** average of RBAC + avatars + upload + E2E smoke + API docs + demo pipeline = **(82+100+60+100+100+100)/6 ≈ 90%**

**Composite production readiness (includes backend + E2E depth):** **(82+100+60+50+100+0)/6 ≈ 65%**

where E2E combined = (100 smoke + 0 mutation) / 2 = 50%.

---

## P13 deliverables index

| Document | Path |
|----------|------|
| RBAC rollout | `context/page-validation/P13-rbac-rollout-report.md` |
| Photo completion | `context/page-validation/P13-photo-completion-report.md` |
| Upload integration | `context/page-validation/P13-upload-integration-report.md` |
| E2E expansion | `context/page-validation/P13-e2e-expansion-report.md` |
| API contract map | `context/page-validation/P13-api-contract-map.md` |
| Notification & audit | `context/page-validation/P13-notification-audit-review.md` |
| This report | `context/page-validation/P13-production-readiness.md` |

---

## Recommended next steps (backend team)

1. Implement borrower, payment, and notification endpoints first (daily operations).
2. Add `photoUrl` or `photoUploadId` resolution on borrower/user DTOs.
3. Stand up upload storage with URL return matching `UploadRecord`.
4. Persist audit log server-side on all mutations (do not rely on client `createEntry` alone).
5. Run `npm run test:e2e` in CI once API or consistent mock server available.
