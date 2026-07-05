# RC1 Contract Verification ÔÇö Phase 2

**Date:** 2026-07-01  
**API integrity:** 135/135 PASS  
**API coverage:** 0 placeholder hits

## New endpoints (Phase 2)

| Method | Path | Request | Response | RBAC |
|--------|------|---------|----------|------|
| POST | `/risk-flags` | entityId, entityName, entityType, flagType, community, reason? | RiskFlagDetail | REVIEW_RISK_FLAGS |
| PATCH | `/risk-flags/:id/escalate` | ÔÇö | RiskFlagDetail | REVIEW_RISK_FLAGS |
| PATCH | `/risk-flags/:id/resolve` | reason? | RiskFlagDetail | REVIEW_RISK_FLAGS |
| PATCH | `/risk-flags/:id/assign` | assignedToUserId | RiskFlagDetail | REVIEW_RISK_FLAGS |
| POST | `/groups` | name, community, displayName?, collectorUserId?, memberBorrowerIds? | GroupDetail | MANAGE_GROUPS |
| POST | `/loan-pools` | name, region, source, capitalPesewas, cycleLabel | LoanPoolDetail | VIEW_FINANCIAL_REPORTS |
| POST | `/collectors` | displayName, email, zone, phone?, assignedRegion? | CollectorDetail | MANAGE_USERS |
| GET | `/messages/threads` | ÔÇö | Thread[] | auth |
| POST | `/messages/threads` | collectorUserId, subject? | Thread | auth |
| GET | `/messages/threads/:id` | ÔÇö | ThreadDetail | auth |
| POST | `/messages/threads/:id/messages` | body | Message | auth |
| PATCH | `/loans/:id/approve` | ÔÇö | LoanDetail | APPROVE_LOANS |
| PATCH | `/loans/:id/reject` | reason | LoanDetail | REJECT_LOANS |
| POST | `/payments/:paymentId/reverse` | reason, actorId | Payment | financial perm |
| GET | `/sync/conflicts` | ÔÇö | Conflict[] | sync perm |
| POST | `/sync/conflicts/:id/approve` | ÔÇö | result | sync perm |
| POST | `/sync/conflicts/:id/reject` | reason? | result | sync perm |

## Error contract

All endpoints return `{ error: { code, message } }` on failure via `AppError` + BFF proxy.

## Pagination

List endpoints return full arrays; client-side pagination retained (existing pattern).

## Verdict

**PASS** ÔÇö Frontend services match backend routes; Zod validation on all new mutation routes.
