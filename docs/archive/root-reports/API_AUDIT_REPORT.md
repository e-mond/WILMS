# API Audit Report — v1.3.6-rc1

**Date:** 2026-07-12

---

## Endpoints modified

| Method | Path | Change |
|--------|------|--------|
| GET | `/health` | Response adds `degradedReasons: string[]` |
| POST | `/messages/threads` | `collectorId` validation: UUID → `string.min(1).max(128)` |

## Messaging flow (verified)

1. `POST /messages/threads` body `{ collectorId }` — admin session required (`requireAuth`)
2. Service `getOrCreateThread` validates collector role via `userRepo.getUserById`
3. `GET /messages/threads/:id` — participant check via `assertThreadParticipant`

**Tests:** `src/tests/messages/routes.schema.test.ts` — 3/3 PASS

## Health endpoint

| Field | Auth | Notes |
|-------|------|-------|
| `/health` | Public | HTTP 200 when DB connected; body may show `degraded` for migration drift |

## Orphaned / duplicate endpoints

None identified in this RC.

## Full inventory

Complete API inventory unchanged from v1.3.5 — see `docs/archive/page-validation/P14.1B-dto-contract-audit.md` for historical catalogue. This RC modifies two surfaces only.
