# Code Quality Review (Phase 17)

**Date:** 17 July 2026  
**Method:** Repository structure review, LOC hotspots, known anti-patterns from architecture exploration.  
**Stance:** Prefer targeted extraction over rewrite.

---

## 1. Hotspots (large modules)

| File | ~LOC | Smell | Recommendation | Class |
|---|---|---|---|---|
| `modules/settings/service.ts` | ~1466 | God service (users, roles, invites, settings, SMS balance) | Split: users / roles / invitations / system-settings | High |
| `modules/communications/service.ts` | ~913 | Broad surface | Separate compose / delivery / audience | Medium |
| `modules/groups/service.ts` | ~866 | Large domain | Extract membership vs risk | Medium |
| `modules/loans/service.ts` | ~729 | Lifecycle + notify + pools | Keep; extract pool resolution helpers | Medium |
| `modules/borrowers/service.ts` | ~726 | Registration + profile | Split read vs write | Medium |

---

## 2. Categories

### Dead / theatre code

| Item | Notes | Action | Class |
|---|---|---|---|
| Payment PATCH “edit” success path | Replaced with 409 immutable | Done in financial remediation | Closed |
| `LOAN_CREATE` idempotency scope unused | Enum only | Wire or remove in v1.4 | Medium |
| `INTEREST_CHARGE` / `PENALTY_CHARGE` writers | Enum without writers | Keep enum for future or document unused | Low |
| Mock-only gates | Production alias disables mocks | Keep CI mock-guard | — |

### Duplicate logic

| Area | Notes | Action |
|---|---|---|
| Dashboard overview interfaces | Duplicated in `service.ts` + `financial-overview.ts` | Single export type |
| Invite password (was duplicated constant) | Centralized `lib/invite-password.ts` | Done |
| Permission checks | shared-rbac + frontend rbac-roles | Keep generate-or-test parity |

### Race conditions / concurrency

| Area | Risk | Mitigation |
|---|---|---|
| Money posts without idempotency key | Double post | Require key (Critical) |
| Pool aggregate refresh | Concurrent disburse | Optimistic version + consider `FOR UPDATE` |
| Offline sync conflicts | Duplicate field posts | Existing conflict queue; strengthen |

### Circular dependencies

| Observation | Monorepo packages generally one-way (`apps` → `packages`). Watch for `modules/settings` ↔ `notifications` cycles — audit with `madge` in v1.4. |

### Memory / process

| In-process mail retry timers | Survive poorly across deploys | Move to durable queue |
| Unbounded `list*` into memory | Dashboard/expenses | SQL aggregates |

### Legacy

| In-memory persistence path | Required for local demo | Keep; never in prod |
| Plaintext demo password fallback | Dev only | Guard with env |

---

## 3. Frontend quality notes

| Item | Class | Note |
|---|---|---|
| Client-side pagination of full lists | High | Replace with server pages |
| Offline queue in localStorage | High | Move to IndexedDB |
| Product tour route drift | Medium | Keep tour map tested |
| Unused hooks/components | Medium | Run knip/ts-prune in CI (v1.4) |

---

## 4. Refactors appropriate now vs later

**Done / in financial branch:** payment immutability, invite password util, dashboard SoT notes, SoD permission removal.

**Do in v1.4 (not drive-by):** settings service split, knip unused export CI, madge cycle check, index migrations.

**Avoid now:** Micro-frontend split, rewriting forms library, renaming all modules.

---

## 5. Suggested CI quality gates (v1.4)

1. `knip` or `ts-prune` — fail on new unused exports in `apps/backend/src/modules`
2. Max file size warning (>800 LOC)
3. `madge --circular`
4. Bundle budgets (already present) keep
