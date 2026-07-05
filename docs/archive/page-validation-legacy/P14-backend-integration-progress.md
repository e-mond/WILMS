# P14 Backend Integration Progress

**Date:** 2026-06-09  
**Prerequisite met:** P13.3 E2E gate ÔÇö 185 passed, 0 failed (`P13.3-e2e-run-r2.log`)

## Delivered in P14.0

### Backend package (`backend/`)

- Express server with CORS, cookie + Bearer session auth, Zod validation
- Response envelope `{ data: T }` / `{ error: { message, code } }`
- RBAC permission middleware mirroring frontend role matrix
- Append-only audit log module
- Local filesystem upload storage abstraction
- In-memory domain store with demo seed data

### API domains (sequenced)

| # | Domain | Status | Key routes |
|---|--------|--------|------------|
| 1 | Infrastructure | Ô£à | `/health`, middleware, audit, uploads storage |
| 2 | Authentication | Ô£à | `POST /auth/login` |
| 3 | Uploads | Ô£à | `/uploads`, `/uploads/:id/content` |
| 4 | Registration | Ô£à | `POST /borrowers`, checks, `DELETE .../registration` |
| 5 | Approval workflow | Ô£à | approve / reject / blacklist / reviewed list |
| 6 | Group automation | Ô£à | formation config, status, process-approval |
| 7 | Collections | Ô£à | `POST /payments`, same-day lookup, payment-entry context |
| 8 | Reporting & audit | Ô£à | `/reports`, `/reports/hub`, `/audit-log` |

### Frontend integration (non-visual)

| File | Change |
|------|--------|
| `src/utils/apiClient.ts` | Envelope unwrap, nested errors, `delete()` |
| `src/lib/auth/authenticate.ts` | Remote login field compatibility |
| `src/services/borrowerService.ts` | `deleteRegistration` API call |
| `src/app/api/wilms/[...path]/route.ts` | BFF proxy with session forwarding |
| `package.json` | `dev:api`, `type-check:api` scripts |

## Validation

| Command | Result |
|---------|--------|
| `npm run type-check` (frontend) | Run after install |
| `npm run type-check:api` | Run after `backend/npm install` |
| `npm run test` | Demo mode unchanged ÔÇö expect 400 pass |
| `CI=1 npm run test:e2e` | Not re-run in API mode this pass |

## Next (P14.1+)

1. Persistent DB + migrations
2. Loans, notifications, settings, search modules
3. Multipart upload + `photoUrl` on DTOs
4. Server-side notification emission on approve/reject/payment
5. API-mode E2E staging job with `NEXT_PUBLIC_API_BASE_URL=/api/wilms`

See `P14-contract-mismatch-audit.md` and `P14-mock-only-persistence-audit.md` for gaps.
