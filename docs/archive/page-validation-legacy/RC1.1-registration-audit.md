# RC1.1 ÔÇö Registration Module Audit

**Date:** 2026-07-01

## Routes

| Page | APIs |
|------|------|
| `/officer/register` | `POST /uploads`, `POST /registration/capture-sessions`, borrower create |
| `/officer/my-registrations` | `GET /borrowers/my-registrations` |

## RBAC

- Registration officer: `CAPTURE_DOCUMENTS`, registration portal access
- Collector also has `CAPTURE_DOCUMENTS` (field registration support)

## CSRF

Mutations require `wilms_csrf` cookie + `x-wilms-csrf` header (`apiClient.ensureCsrfToken`).

## Manual verification

Registration upload flow should be verified in browser post-deploy (listed in production verification checklist).

## Verdict

**PASS (code)** ÔÇö APIs and permissions aligned; manual upload smoke pending operator sign-off.
