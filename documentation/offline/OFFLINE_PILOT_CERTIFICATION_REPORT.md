# WILMS Offline Pilot Certification Report (Phase 9J)

**Product version:** 1.8.0 (identity unchanged — no version bump)  
**Language:** British English  
**Certification branch:** `feature/v1.8.0-offline-pilot-cert`  
**Baseline / rollback tag:** `v1.8.0-offline-rc1` (`861127db9786724262178c3e6464ce8ae4823eeb`)  
**Main tip at certification start:** `28ae9de` (Feature/v1.8.0 offline first pwa #186)  
**Date:** 2026-08-10  
**Scope rule:** Documentation and automated evidence only. **No** new financial offline write features.

---

## Executive recommendation

### **YES WITH CONDITIONS**

Phases 0–8 foundation (architecture, flag default-off, Phase 5 navigate fallback, automated flag tests, financial write inventory discipline) may remain on `main` and continue as documentation/product baseline.

**Do not:**

1. Set `WILMS_OFFLINE_MODE` / `NEXT_PUBLIC_WILMS_OFFLINE_MODE=true` in production.  
2. Start **Phase 3D** payment-queue deepening / money-path hardening until Phase **9A–9B** device + airplane-mode navigation evidence exists.  
3. Treat this pack as “WhatsApp-style full offline certified.”

**Do:**

1. Merge this Phase 9 documentation pack so BLOCKED gaps are visible to the owner.  
2. Keep `v1.8.0-offline-rc1` as the known offline engineering baseline.  
3. Schedule a human device lab (Android Chrome minimum) before any production flag enablement or 3D work.

---

## Phase 9 deliverable index

| ID | File | Status |
|----|------|--------|
| 9A | `OFFLINE_DEVICE_MATRIX.md` | Complete — all interactive rows **BLOCKED** |
| 9B | `OFFLINE_NAVIGATION_CERTIFICATION.md` | Complete — code expectations + device rows **BLOCKED** |
| 9C | `STATE_PERSISTENCE_REPORT.md` | Complete — code inventory; live recovery **BLOCKED** |
| 9D | `SERVICE_WORKER_LIFECYCLE_REPORT.md` | Complete — code review; deploy proofs **BLOCKED** |
| 9E | `CONNECTIVITY_TRANSITION_REPORT.md` | Complete — expected behaviour; throttling/captive **BLOCKED** |
| 9F | `OFFLINE_AUTH_REPORT.md` | Complete — code analysis; live privilege tests **BLOCKED** |
| 9G | `FINANCIAL_SAFETY_VALIDATION.md` | Complete — queue inventory; no Phase 5 money invent |
| 9H | `OFFLINE_PERFORMANCE_REPORT.md` | Complete — method defined; measures **BLOCKED** |
| 9I | `FAILURE_INJECTION_REPORT.md` | Complete — desk procedures; live inject **BLOCKED** |
| 9J | This report | Complete |

Prior pack (Phases 0–8) remains under `documentation/offline/` (`ARCHITECTURE_DISCOVERY_REPORT.md` … `FINAL_OFFLINE_RECOMMENDATION.md`).

---

## Automated tests executed (this environment)

| Check | Command / scope | Result | Evidence file |
|-------|-----------------|--------|---------------|
| Type-check frontend | `npm run type-check -w @wilms/frontend` | **PASS** (EXIT 0) | `evidence/phase9-typecheck.txt` |
| Type-check domain | `npm run type-check -w @wilms/domain` | **PASS** (EXIT 0) | `evidence/phase9-typecheck.txt` |
| Lint frontend | `npm run lint -w @wilms/frontend` | **PASS** (EXIT 0) | `evidence/phase9-lint.txt` |
| Domain feature-flags unit | `vitest run … feature-flags.test.ts` | **PASS** (4 tests) | `evidence/phase9-unit-tests.txt` |
| Frontend offline-mode unit | `vitest run … offline-mode` (3 tests) | **PASS** | `evidence/phase9-unit-tests.txt` |
| Frontend production build | `npm run build -w @wilms/frontend` | **PASS** (EXIT 0) | `evidence/phase9-build.txt` |
| Full monorepo `npm run test` | Not run in full | **Not claimed** — offline-relevant subset recorded above | — |
| Device / airplane / PWA E2E interactive | — | **BLOCKED** | 9A–9B |

No fabricated screenshots, browser logs, or device timings were added.

---

## Risks (honest)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Enabling offline flag in prod without device matrix | High | Keep flag default **false**; gate ops change on 9A unblock |
| Expanding payment queue (3D) before durability evidence | High | Recommendation blocks 3D start |
| Operators misreading “Phase 9 complete” as pilot-ready | Medium | This report’s CONDITIONS section + BLOCKED matrix |
| SW / multi-tab / captive portal edge cases unproven | Medium | 9D–9F BLOCKED until lab |
| Tag vs GitHub Release gap for `v1.8.0` product identity | Low | Product stays 1.8.0; rollback tag exists; do not invent Release unless owner asks |

---

## Phase 3D payment-queue deepening — gate decision

| Question | Answer |
|----------|--------|
| May Phase 3D start now? | **No** |
| Why? | No Android/desktop airplane navigation certification (9A–9B); no live financial-safety device proof beyond code inventory (9G) |
| When may it start? | After minimum: Android Chrome offline navigation pass + documented sync/conflict path for existing `RECORD_PAYMENT` queue under flag-on and flag-off parity |

---

## Merge guidance (PR B)

| Question | Guidance |
|----------|----------|
| Merge this Phase 9 PR? | **Yes** — documentation + evidence only; does not enable the flag or ship money features |
| Keep PR open if recommendation is conditional? | Conditional recommendation is recorded **inside** the merged docs; merging is still appropriate so the gate is auditable on `main` |
| Enable production offline mode after merge? | **No** |
| Start Phase 3D after merge? | **No** — until device evidence closes 9A–9B |

---

## Sign-off fields

| Field | Value |
|-------|--------|
| Branch | `feature/v1.8.0-offline-pilot-cert` |
| Related tag | `v1.8.0-offline-rc1` |
| Commit (fill at PR tip) | `09c0331fdf8f3f29a8bd39a3d66344919f07a213` |
| Tests passed | type-check (frontend+domain), lint, offline-relevant unit subset, frontend production build |
| Tests blocked | Device matrix, interactive PWA, full suite claim, performance numbers |
| Executive recommendation | **YES WITH CONDITIONS** |
| Phase 3D allowed | **No** |
| Production `WILMS_OFFLINE_MODE=true` | **No** |
