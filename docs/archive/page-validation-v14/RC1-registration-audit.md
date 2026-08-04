# RC1 Registration & User Invite Audit

**Date:** 2026-07-01

## Borrower registration

| Step | Backend | Status |
|------|---------|--------|
| Submit registration | `POST /borrowers` | Implemented |
| Duplicate checks | `/borrowers/check-phone`, `check-id`, `check-name` | Implemented |
| Pending queue | `GET /borrowers/pending` | Implemented |
| Approve/reject | `PATCH /borrowers/:id/approve`, `/reject` | Implemented |

## Settings user invite (admin)

| Step | Implementation | Status |
|------|----------------|--------|
| Create user | `POST /settings/users` | Implemented |
| Validation | Email, role, duplicate check in `createUser()` | Fixed in PR #33 |
| Default password | `ChangeMe1!` (INVITED status) | Documented — force reset on first login recommended |
| Permission | `MANAGE_USERS` required | Verified |

## Known limitations (documented, not blockers)

- User invite does not send email automatically — admin must communicate credentials separately until welcome-email workflow is added (see RC1-next-roadmap.md)
- Pool/group creation buttons show "not yet available" toast — creation workflows deferred

## Verdict

Registration and invite flows functional at API level. Email delivery for invites is a roadmap item.
