# WILMS v1.1.2 — Registration Fix Report

**Branch:** `hotfix/v1.1.2-user-management-notifications`  
**Version:** `1.1.2`  
**Date:** 2026-07-07

## Executive summary

Three registration issues were fixed: Registration Officers could not view their own borrower details, address input fields were unstable during typing, and "Type of Work → Other" did not capture a custom value.

## Issue 1 — Registration Officer cannot view registered borrowers

### Root cause

"My Registrations" list linked to `/borrowers/:id` (super-admin shell). Officers lack `VIEW_ALL_BORROWERS` permission and received 403 or blank pages. Backend `GET /borrowers/:id` had no officer-scoped access check.

### Fix

**Frontend:**
- New detail page: `apps/frontend/src/app/(registration-officer)/officer/my-registrations/[id]/page.tsx`
- `MyRegistrationsList.tsx` — View link routes to `/officer/my-registrations/{id}`; drafts link to edit flow

**Backend:**
- `apps/backend/src/modules/borrowers/access.ts` — **New** `assertBorrowerReadAccess()`, `resolveOfficerIdForList()`
- `apps/backend/src/modules/borrowers/routes.ts` — RBAC on `GET /borrowers/:id`, `/review`, `/full-profile`
- `apps/backend/src/modules/borrowers/registration-workflow.ts` — Workflow status alignment (`SUBMITTED`, `UNDER_REVIEW`, etc.)
- `listMyRegistrations()` merges drafts from `registration-draft.repository`

### Officer capabilities (post-fix)

| Action | Scope |
|--------|-------|
| View borrower details | Own registrations only |
| Search My Registrations | Own registrations only |
| Review submitted registration | Own registrations only |
| Continue draft | Own drafts only |

## Issue 2 — Home Address / Business Address instability

### Root cause

`BorrowerRegistrationWizard.tsx` used unscoped `watch()` for the review step, causing the entire wizard to re-render on every keystroke in address fields. This produced focus loss, cursor jumps, and perceived input malfunction (React re-render storm).

### Fix

- Removed unscoped `watch()` subscription for review panel
- Review step now reads form values only when navigating to review (scoped watch per step)
- Autosave debounce unchanged; no longer triggers full wizard re-render

### Files modified

- `apps/frontend/src/features/borrower-registration/components/BorrowerRegistrationWizard.tsx`

## Issue 3 — Type of Work "Other" missing custom input

### Root cause

Selecting "Other" in the Type of Work dropdown had no companion text field, no validation, and stored only the literal string "Other".

### Fix

**Schema validation** (`registration.schema.ts`):
```typescript
if (data.typeOfWork === 'Other' && !data.typeOfWorkOther?.trim()) {
  // Required "Please specify" when Other selected
}
```

**UI** (`BorrowerRegistrationWizard.tsx`):
- Conditional `typeOfWorkOther` text input shown when `typeOfWork === 'Other'`
- Label: "Please specify"

**Persistence** (`registration.utils.ts`):
- When `typeOfWork === 'Other'`, stores `typeOfWorkOther` value in `typeOfWork` column
- Exports, reports, profile, and API display the custom value

**Types** (`types/borrower-registration.ts`, `types/borrower.ts`):
- Added `typeOfWorkOther?: string`

## APIs affected

| Endpoint | Change |
|----------|--------|
| `GET /borrowers/:id` | Officer-scoped read access |
| `GET /borrowers/:id/review` | Officer-scoped read access |
| `GET /borrowers/:id/full-profile` | Officer-scoped read access |
| `GET /borrowers/my-registrations` | Officer ID scoping + draft merge |

## Database changes

None for registration fixes. `typeOfWork` column already exists; custom value stored in same field.

## Verification evidence

| Check | Result |
|-------|--------|
| `registration.schema.test.ts` | PASS |
| `npm run test -w @wilms/frontend` | 223/223 PASS |
| `smoke:rbac` officer checks | 11/11 PASS |
| Officer blocked from admin dashboard | ✅ `expect 403` |

## Remaining issues

- Officer cannot view borrowers registered by other officers (by design)
- Guarantor relationship "Other" field not in scope for this hotfix
