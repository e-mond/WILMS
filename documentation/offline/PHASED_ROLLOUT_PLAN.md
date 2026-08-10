# WILMS Offline Phased Rollout Plan

**Product version:** 1.8.0  
**Sprint branch:** `feature/v1.8.0-offline-first-pwa`  
**Rollback tag:** `v1.8.0-offline-rc1`  
**Phase:** 3 — Integration / rollout plan (documentation only; no implementation)  
**Language:** British English  
**Depends on:** [`OFFLINE_ARCHITECTURE_DESIGN.md`](./OFFLINE_ARCHITECTURE_DESIGN.md), [`SAFETY_AND_INTEGRATION_ANALYSIS.md`](./SAFETY_AND_INTEGRATION_ANALYSIS.md)

## Executive summary

This plan decomposes offline-first work into **3A–3H** so production risk stays low. Each slice is flag-gated, testable, and independently rollbackable. Financial write **expansion** is deferred until Phase 7 simulation. Payment confirmation notifications remain the receipt mechanism.

**Do not** implement 3A–3H as a single release.

---

## Global controls

| Control | Detail |
|---------|--------|
| Master flag | `WILMS_OFFLINE_MODE` (default `false`) — Phase 4 |
| Rollback | Revert deploy + ensure flag false; tag `v1.8.0-offline-rc1` for code rollback |
| Identity | Stay on product **v1.8.0** unless owner authorises bump/tag |
| Receipt rule | No PDF receipts; preserve `PAYMENT_CONFIRMED` |

---

## Phase 3A — Offline shell (read-only navigability)

| Field | Detail |
|-------|--------|
| Goal | App shell usable offline for precached routes; banner/indicator accurate |
| Code touched | `public/sw.js`, `OfflineBanner`, `AppOfflineShell`, SW registrar; **no** payment handlers |
| Migrations | None |
| Feature flags | `WILMS_OFFLINE_MODE` + optional `WILMS_OFFLINE_SHELL_FALLBACK` |
| Tests | PWA e2e smoke; airplane mode open precached collector/dashboard; flag-off = today |
| Production risk | **Low** — caching only |
| Rollback | Disable flags; redeploy prior SW cache version |

**Maps to sprint Phase 5 minimal implementation.**

---

## Phase 3B — Read caches (borrower / group / notifications)

| Field | Detail |
|-------|--------|
| Goal | Expand IndexedDB snapshots for collector field reads |
| Code touched | `offlineSnapshotStore.ts`, collector query hooks, notification inbox (existing pattern) |
| Migrations | None |
| Feature flags | `WILMS_OFFLINE_READ_CACHE_EXPAND` |
| Tests | Offline reopen shows last snapshot with as-of label; no writes |
| Production risk | **Low–medium** (stale data UX) |
| Rollback | Flag off; clear snapshot keys optional |

---

## Phase 3C — Local drafts (registration) — no sync

| Field | Detail |
|-------|--------|
| Goal | Persist registration wizard drafts locally if network drops |
| Code touched | Registration wizard local store; **no** `/borrowers/drafts` offline batch |
| Migrations | None |
| Feature flags | Subflag under offline mode |
| Tests | Close browser offline; reopen draft; online submit still uses existing APIs |
| Production risk | **Medium** (duplicate drafts if user also has server draft) |
| Rollback | Flag off; ignore local draft keys |

**Does not** change registration submit integrity.

---

## Phase 3D — Offline payment queue hardening (existing path)

| Field | Detail |
|-------|--------|
| Goal | Move/dual-write mutation queue to IndexedDB; keep idempotent replay + conflict review |
| Code touched | `offlineQueueStore.ts`, payment sync handler, migrate-from-localStorage |
| Migrations | None (client-only); server already has `offline_sync_*` |
| Feature flags | `WILMS_OFFLINE_QUEUE_IDB` |
| Tests | Queue survives reload; duplicate replay; conflict path still works; confirmation after apply |
| Production risk | **High** if mishandled — treat as financial change |
| Rollback | Flag off + ensure localStorage path still drains |

**No new payment business rules.**

---

## Phase 3E — Reconciliation drafts (local only)

| Field | Detail |
|-------|--------|
| Goal | Allow collectors to draft recon numbers offline; submit only online |
| Code touched | Reconciliation UI local draft store |
| Migrations | None |
| Feature flags | Explicit subflag |
| Tests | Cannot submit while offline; online submit unchanged |
| Production risk | **Medium** |
| Rollback | Flag off |

**Decisions remain Online Only** (Phase 1).

---

## Phase 3F — Background synchronisation polish

| Field | Detail |
|-------|--------|
| Goal | Reliable drain on reconnect / Background Sync / multi-tab |
| Code touched | `background-sync.ts`, `useOfflineQueueSync`, BroadcastChannel coordination |
| Migrations | None |
| Feature flags | Covered by master + queue flags |
| Tests | Flapping network; multi-tab single drain; no double apply (idempotency) |
| Production risk | **Medium–high** |
| Rollback | Disable background sync registration; manual sync remains |

---

## Phase 3G — Conflict resolution UX

| Field | Detail |
|-------|--------|
| Goal | Clearer Approver conflict review and collector visibility of `queued_for_review` |
| Code touched | Approver sync-conflicts UI, collector sync panel copy |
| Migrations | None expected |
| Feature flags | UX can ship independently if server semantics unchanged |
| Tests | Conflict approve/reject; collector status transitions |
| Production risk | **Medium** |
| Rollback | Revert UI |

---

## Phase 3H — Full collector offline mode (bounded)

| Field | Detail |
|-------|--------|
| Goal | Collector day: shell + cached reads + existing three write queues + indicators |
| Code touched | Integration of 3A–3G; collector UX copy |
| Migrations | None new if prior phases done |
| Feature flags | Master on for pilot tenants/devices only |
| Tests | End-to-end field simulation + Phase 6/7 reports |
| Production risk | **High** — pilot only |
| Rollback | Master flag off |

**Still excludes:** admin fees, recon decisions, registration sync, pools, disbursements, adjustments, reports/exports writes.

---

## Mapping to sprint implementation phases

| Sprint phase | Rollout slices | Deliverable type |
|--------------|----------------|------------------|
| 4 Feature flag | Global boundary | Code + tests |
| 5 Minimal implementation | **3A** (+ banner/indicator) | Code |
| 6 Test everything | 3A (+ existing queues regression) | `PHASE6_TEST_REPORT.md` |
| 7 Financial simulation | Gate for 3D deepen / any new money types | `FINANCIAL_OFFLINE_SIMULATION.md` |
| 8 Recommendation | Strategy A–E | `FINAL_OFFLINE_RECOMMENDATION.md` |

---

## Test requirements (every rollout slice)

- `npm run type-check`  
- `npm run lint`  
- Frontend tests (targeted + offline/PWA where relevant)  
- Domain tests when sync touched  
- Production build  
- Flag-off parity smoke  

Stop on regression; fix; retest; then continue.

---

## Production risk heatmap

| Slice | Risk | Why |
|-------|------|-----|
| 3A | Low | Cache/UX |
| 3B | Low–Med | Stale reads |
| 3C | Med | Draft duplication |
| 3D | High | Money queue durability |
| 3E | Med | Draft confusion |
| 3F | Med–High | Drain races |
| 3G | Med | Review UX |
| 3H | High | Combined surface |

---

## Recommended pilot order

1. Phase 4 flags  
2. 3A (sprint Phase 5)  
3. Phase 6 evidence  
4. 3B → 3F (harden existing) before 3C/3E  
5. Phase 7 before any new financial queue types  
6. 3H pilot  

---

## Next phase

**Phase 4 — Feature flag infrastructure** (code): implement `WILMS_OFFLINE_MODE` default false with tests proving disabled behaviour matches current production paths. Do not expand financial queues in Phase 4.
