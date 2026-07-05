# RC1.4 ÔÇö Registration & Guarantor Validation

**Status:** IMPLEMENTED on `release/rc1-4-v1-certification`

## Draft auto-save & resume

| Feature | Implementation |
|---------|----------------|
| Draft table | `registration_drafts` migration `0011_rc14_registration_capture.sql` |
| API | `POST/PATCH/GET/DELETE /borrowers/drafts`, `POST /borrowers/drafts/:id/submit` |
| Auto-save | Debounced on step completion in `BorrowerRegistrationWizard.tsx` |
| Resume | `?edit={draftId}` loads draft payload + restores step |
| Submit | Finalizes via draft submit endpoint |

## Ghana address data

| Feature | Status |
|---------|--------|
| Regions API | `GET /locations/regions` |
| Districts API | `GET /locations/regions/:id/districts` |
| Cities API | `GET /locations/districts/:id/cities` |
| Search API | `GET /locations/search?q=` |
| Frontend wiring | Uses `locationService` (API-backed in production) |

## Guarantor validation

Backend implements real eligibility in `guarantor-eligibility.ts`:

- Max 3 active guarantees
- Duplicate profile detection
- Borrower phone mismatch
- Leader exemption

Frontend passes `borrowerPhone` with debounced step validation.

Tests: `apps/backend/src/tests/borrowers/guarantor-eligibility.test.ts`
