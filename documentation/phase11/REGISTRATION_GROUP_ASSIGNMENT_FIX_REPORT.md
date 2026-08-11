# Registration Group Assignment Fix Report

**Product:** WILMS v1.8.0  
**Branch:** `feature/v1.8.0-registration-loan-communications-hardening`  
**Status:** Implemented

## Executive summary

Approver **Assign Group** no longer fails silently. The UI validates selection, posts membership by borrower ID, surfaces success/error toasts, invalidates related queries, and the domain writes an audit entry (`group.member_added`). Failures show: *We couldn't assign the borrower to the selected group. Please try again.*

## Behaviour

| Step | Result |
|------|--------|
| No group selected | Client validation error |
| Success | Toast + workflow message + query refresh (groups, borrowers, dashboards) |
| Failure | Fixed user copy + `console.error` for operators |
| Audit | `group.member_added` with actor and reason |
| Notify | Borrower SMS (`GROUP_ASSIGNED`); collector/actor in-app |

## Files

- `apps/frontend/.../PendingApplicationReview.tsx`
- `packages/domain/src/modules/groups/service.ts`
- `packages/domain/src/modules/groups/routes.ts`
