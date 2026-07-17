# Developer Experience Review — Phase 24.7

**Date:** 17 July 2026  
**Scope:** Monorepo ergonomics, testing, CI, onboarding, tooling  
**Goal:** v1.4 ships faster with fewer regressions on money paths

---

## Current state assessment

| Area | v1.3.8 state | Grade | v1.4 target |
|------|--------------|-------|-------------|
| Monorepo structure | npm workspaces + Turborepo; `apps/frontend`, `apps/backend`, `packages/shared-*` | B+ | Document boundaries in ADR-005 |
| Node version | Root `engines: ">=20"`; CI may differ | C | **Node 22 unify** |
| Type-check | Root `type-check` covers frontend + api | B+ | Add to PR required checks |
| Unit tests | Frontend vitest strong; backend vitest exists but **not in root `npm test`** | C | Root script runs both workspaces |
| E2E | Playwright in frontend (`test:e2e`) | B | Money path smoke in CI staging |
| Lint | Root `lint` frontend-only | C | Backend eslint in CI gate |
| OpenAPI | Hand-maintained contracts in shared packages | D | Generated from Express routes |
| Dead code | No automated gate | D | knip + madge in CI |
| Onboarding | `AGENTS.md`, `CONTRIBUTING.md`, context docs | B | Single "day 1" checklist |
| Generators | PWA icons script; no module generator | C | Optional route/service template |
| Local dev | In-memory API without `DATABASE_URL`; mock frontend default | A- | Document `.env.local` for real API |

---

## Monorepo

### Strengths

- Shared contracts (`@wilms/shared-contracts`, `shared-rbac`, `shared-validation`) prevent frontend/backend drift.
- Turborepo caching for builds.
- Clear workspace scripts in root `package.json`.

### Gaps

| Gap | Why it hurts | v1.4 action | Effort (pd) | Priority |
|-----|--------------|-------------|-------------|----------|
| `settings/service.ts` ~1.4k LOC | Merge conflicts; slow onboarding | Split into treasury/settings modules | 8–12 | **P2** |
| Cross-module imports | Bounded context blur | Enforce via madge + lint rule | 3–5 | **P2** |
| Root test script frontend-only | Backend regressions slip | `npm test` runs api + frontend | 1–2 | **P1** |

### Recommendation: Node 22 unify

| Field | Detail |
|-------|--------|
| **Why** | RC validation flagged Node 20/22 skew (M6) |
| **Benefits** | Parity with CI VM (Node 22); security patch alignment |
| **Trade-offs** | Native module rebuild; Vercel/Railway pin update |
| **Complexity** | 2–4 pd |
| **Priority** | **P1** |

---

## Testing

### Current coverage

| Layer | Tool | Location |
|-------|------|----------|
| Frontend unit | Vitest | `apps/frontend` |
| Backend unit/integration | Vitest | `apps/backend/src/tests` |
| E2E | Playwright | `apps/frontend` |
| Production smoke | Custom scripts | `apps/backend/src/verification` |
| RBAC smoke | `smoke:rbac` | api workspace |

### Gaps for v1.4

| Gap | v1.4 action | Effort (pd) | Priority |
|-----|-------------|-------------|----------|
| Idempotency not required in tests | Add concurrent POST chaos tests when FA-04 ships | 3–5 | **P0** |
| No BullMQ integration test | Testcontainers Redis or mock; DLQ replay test | 5–8 | **P1** |
| Cursor pagination contract untested | Contract tests on list handlers | 3–5 | **P1** |
| Backend not in default CI test | Wire `npm run test -w @wilms/api` to CI | 1 | **P0** |

### Definition of Done (v1.4 money features)

Any P0 money/queue change requires:

- Unit tests for happy path + idempotency replay
- Integration test with real PG (or test container)
- RBAC test if new endpoint
- Update `context/requirements-traceability.md` (implementation phase)

---

## CI pipeline recommendations

| Gate | v1.3.8 | v1.4 add |
|------|--------|----------|
| `npm ci` | ✅ | ✅ |
| `npm run type-check` | ✅ | ✅ |
| `npm run lint` | Frontend | + backend lint |
| `npm run test` | Frontend | + `test -w @wilms/api` |
| `npm run verify:version` | Manual | PR required |
| `npm run verify:migrations` | Manual | PR required if SQL changed |
| knip | ❌ | Dead export gate |
| madge | ❌ | Circular dependency gate |
| OpenAPI diff | ❌ | Breaking change comment |

---

## Onboarding — "Day 1" checklist (proposed)

1. Clone repo; `npm ci` from root.
2. Read `AGENTS.md` → `docs/planning/v1.4/INDEX.md` for roadmap context.
3. `npm run dev:api` (port 4000) — in-memory OK for first hour.
4. Create `apps/frontend/.env.local` for real API (see root `AGENTS.md`).
5. `npm run dev` (port 3000); login `admin@wilms.demo` / `DemoAdmin1!`.
6. Run `npm run type-check` and `npm run test -w @wilms/api` before first PR.
7. Money changes: read `FINANCIAL_ENGINE_V2_DESIGN.md` + BRD §9.

**Effort to publish checklist:** 1 pd | **Priority:** **P2**

---

## OpenAPI generation

| Field | Detail |
|-------|--------|
| **Why** | Hand-maintained types drift from routes; partner integrations need contract |
| **Benefits** | Single spec; frontend client codegen optional; audit trail |
| **Trade-offs** | Initial route annotation burden; spec review in PR |
| **Complexity** | 6–10 pd |
| **Priority** | **P2** |

**Approach:** `zod-to-openapi` or `@asteasolutions/zod-to-openapi` on existing validation schemas; expose `/api/openapi.json` behind admin auth.

---

## knip / madge

| Tool | Purpose | v1.4 gate |
|------|---------|-----------|
| **knip** | Unused exports, dead files | CI warning → error after baseline |
| **madge** | Circular dependencies in `apps/backend/src` | Fail on new cycles |

| Field | Detail |
|-------|--------|
| **Why** | Codebase health report flagged debt; `settings/service.ts` coupling |
| **Benefits** | Prevents rot; faster refactors |
| **Trade-offs** | False positives; baseline maintenance |
| **Complexity** | 3–5 pd |
| **Priority** | **P2** |

---

## Generators (optional v1.4)

Low priority — only if team bandwidth:

| Generator | Output | Effort (pd) |
|-----------|--------|-------------|
| `npm run generate:module` | route + service + test stub | 3–5 |
| `npm run generate:migration` | numbered SQL template | 1–2 |

**Priority:** **P3** — manual patterns are fine for team size.

---

## Developer experience priorities (v1.4)

| Item | Effort (pd) | Priority |
|------|-------------|----------|
| Backend tests in root CI | 1–2 | **P0** |
| Node 22 unify | 2–4 | **P1** |
| Idempotency + queue test harness | 8–13 | **P0** |
| OpenAPI generation | 6–10 | **P2** |
| knip/madge CI | 3–5 | **P2** |
| Onboarding checklist | 1 | **P2** |
| Module generator | 3–5 | **P3** |

---

## References

- [`CODEBASE_HEALTH_REPORT.md`](../../certification/v1.3.8/enterprise-excellence/CODEBASE_HEALTH_REPORT.md)
- [`TEST_COVERAGE_REPORT.md`](../../certification/v1.3.8/enterprise-excellence/TEST_COVERAGE_REPORT.md)
- Root [`AGENTS.md`](../../AGENTS.md)
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
