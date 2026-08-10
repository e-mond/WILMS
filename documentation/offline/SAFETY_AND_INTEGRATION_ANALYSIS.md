# WILMS Safety and Integration Analysis

**Product version:** 1.8.0  
**Sprint branch:** `feature/v1.8.0-offline-first-pwa`  
**Rollback tag:** `v1.8.0-offline-rc1`  
**Phase:** 1 — Safety analysis (documentation only; no behaviour change)  
**Language:** British English  
**Depends on:** [`ARCHITECTURE_DISCOVERY_REPORT.md`](./ARCHITECTURE_DISCOVERY_REPORT.md)

## Executive summary

Offline-first behaviour **can** be extended without harming production **only** if new work stays inside a kill-switch boundary and does not invent write paths that the repository does not already support with idempotency and conflict controls.

Today’s durable offline **writes** are limited to three queue types: payments, expenses, and holiday request creates. Everything else is online-only or shell/read-cache. Payments already use Approver conflict review; expenses and holidays do not. The payment confirmation notification remains the authoritative borrower “receipt” — offline sync must not invent PDF receipts.

**Verdict for integration safety:** Proceed with a **phased, flag-gated** programme (Phases 3A–3H). Do **not** enable new financial write types (admin fees, reconciliations, pools, disbursements, adjustments) until Phase 7 simulation proves safety.

---

## Classification legend

| Class | Meaning |
|-------|---------|
| **Safe Offline** | Local complete + durable sync with financial-grade controls (idempotency + conflict policy). Rare in WILMS today. |
| **Safe Cached** | Read-only local cache acceptable; freshness caveats must be visible. |
| **Queue Required** | Offline write only via durable queue + defined sync/idempotency (and conflict review where financial). |
| **Online Only** | Must not mutate offline; shell may still open. |

---

## Prior documentation (authoritative baselines)

| Source | Durable offline writes | Online-only (explicit) |
|--------|------------------------|------------------------|
| [`docs/offline-architecture.md`](../../docs/offline-architecture.md) | Payments, expenses, holiday request create | Approvals, reconciliation decisions, registration, reports, documentation writes |
| [`docs/v1.8.0/OFFLINE_ARCHITECTURE_REPORT.md`](../../docs/v1.8.0/OFFLINE_ARCHITECTURE_REPORT.md) | Same | Approvals/recon preferred online; registration/reports/docs — no durable offline write yet |
| [`docs/v1.8.0/OFFLINE_COMPLETION_REPORT.md`](../../docs/v1.8.0/OFFLINE_COMPLETION_REPORT.md) | Same three | Full write coverage iterative |

**Code proof of queue surface:** `apps/frontend/src/types/offline-queue.ts` — only `RECORD_PAYMENT`, `RECORD_EXPENSE`, `HOLIDAY_REQUEST_CREATE`.  
**Financial conflict set:** payment operations only — `packages/domain/src/modules/sync/constants.ts`.

---

## Module analysis

### 1. Payments

| Question | Finding |
|----------|---------|
| Safe to cache? | Partial — borrower/due lists may be snapshotted; not a money source of truth |
| Safe to edit offline? | Yes **only** via existing queue + batch ingest |
| Requires online-only? | No for record; yes for any non-queued mutation shape |
| Conflict risk | **High** — mitigated by `QUEUED_FOR_REVIEW` / `offline_sync_conflicts` |
| Financial risk | **Critical** |
| Strategy | Keep **Queue Required**; harden durability (IndexedDB) later; never bypass conflict review |

**Evidence:** `paymentService.ts`, `useRecordPaymentOrQueue.ts`, `paymentSyncHandler.ts`, `packages/domain/src/modules/sync/service.ts`, `emitPaymentConfirmedNotification`.

**Class:** **Queue Required**

### 2. Admin fees

| Question | Finding |
|----------|---------|
| Safe to cache? | Shell route only (`/collector/admin-fee` in SW) |
| Safe to edit offline? | **No** — no queue type |
| Requires online-only? | **Yes** |
| Conflict risk | Online duplicate 409 exists; no offline conflict pipeline |
| Financial risk | **High** (fees + disbursement gates) |
| Strategy | **Online Only** until a dedicated queue + conflict design exists |

**Evidence:** `transactionService.ts`, `useRecordAdminFee.ts`, `packages/domain/src/modules/transactions/`.

**Class:** **Online Only**

### 3. Reconciliations

| Question | Finding |
|----------|---------|
| Safe to cache? | List/summary reads may be shell-cached; cash totals must be live for decisions |
| Safe to edit offline? | **No** — submit/review are online APIs only |
| Requires online-only? | **Yes** for decisions |
| Conflict risk | **High** (variance, SoD) |
| Financial risk | **Critical** |
| Strategy | **Online Only**; draft UI later only behind flags (Phase 3E), not silent apply |

**Evidence:** `reconciliationService.ts`, `packages/domain/src/modules/reconciliation/`, hub online-only matrix.

**Class:** **Online Only**

### 4. Expenses

| Question | Finding |
|----------|---------|
| Safe to cache? | Lists can be cached with caveats |
| Safe to edit offline? | Yes via existing queue |
| Requires online-only? | No for create-when-queued |
| Conflict risk | **Medium** — sync applies **directly** (no payment-style conflict queue) |
| Financial risk | **High** |
| Strategy | **Queue Required**; Phase 7 must revisit whether expense needs SoD review like payments |

**Evidence:** `useRecordExpenseOrQueue.ts`, `expenseSyncHandler.ts`, expenses routes.

**Class:** **Queue Required**

### 5. Borrower registration (including drafts)

| Question | Finding |
|----------|---------|
| Safe to cache? | Shell for officer routes; draft payload is server-backed today |
| Safe to edit offline? | **Not today** — drafts CRUD/submit are online; upload queue ≠ draft sync |
| Requires online-only? | **Yes** for submit/approval integrity |
| Conflict risk | Medium (duplicate phone/ID) when eventually queued |
| Financial risk | Low until loan linkage |
| Strategy | **Online Only** now; Phase 3C may add **local draft persistence** without sync; sync only after design |

**Evidence:** `borrowerService.ts`, `packages/domain/src/modules/borrowers/routes.ts`, hub matrix.

**Class:** **Online Only** (local draft persistence = future Safe Cached / Queue Required — not present)

### 6. Group operations

| Question | Finding |
|----------|---------|
| Safe to cache? | Group lists for field navigation — possible later; not implemented as snapshots |
| Safe to edit offline? | **No** |
| Requires online-only? | **Yes** |
| Conflict risk | High for membership / collector reassignment |
| Financial risk | Medium–high (`record-adjustment` paths) |
| Strategy | **Online Only** |

**Evidence:** `packages/domain/src/modules/groups/routes.ts`, group-management features.

**Class:** **Online Only**

### 7. Notifications

| Question | Finding |
|----------|---------|
| Safe to cache? | **Yes** — inbox IndexedDB snapshot exists |
| Safe to edit offline? | Prefs/mark-read/push subscribe should stay online |
| Requires online-only? | Emit path is **server-side** on payment apply |
| Conflict risk | Stale inbox |
| Financial risk | Confirmation timing affects borrower trust, not ledger math |
| Strategy | Inbox **Safe Cached**; emit/prefs **Online Only**; preserve `PAYMENT_CONFIRMED` after sync |

**Evidence:** `useNotificationInbox.ts`, `offlineSnapshotStore.ts`, `payment-notifications.ts`.

**Class:** **Safe Cached** (reads) / **Online Only** (emit & settings)

### 8. Reporting

| Question | Finding |
|----------|---------|
| Safe to cache? | Shell may open `/reports`; **no** report snapshot keys in IndexedDB store |
| Safe to edit offline? | N/A (GET) |
| Requires online-only? | **Yes** for trustworthy aggregates |
| Conflict risk | Stale aggregates mislead operators |
| Financial risk | High if treated as live |
| Strategy | **Online Only** data; do not invent offline report generation |

**Evidence:** `reportService.ts`, `offlineSnapshotStore.ts` key inventory.

**Class:** **Online Only**

### 9. Exports

| Question | Finding |
|----------|---------|
| Safe to cache? | Job metadata only if explicitly designed; not present |
| Safe to edit offline? | **No** — `POST /exports/jobs` |
| Requires online-only? | **Yes** |
| Conflict risk | Duplicate jobs |
| Financial risk | Export of sensitive financial data |
| Strategy | **Online Only** |

**Evidence:** `intelligenceService.ts`, intelligence export routes.

**Class:** **Online Only**

### 10. Executive dashboard

| Question | Finding |
|----------|---------|
| Safe to cache? | **Not implemented** for executive payload (admin `dashboard-summary` snapshot ≠ executive) |
| Safe to edit offline? | N/A |
| Requires online-only? | **Yes** for decisions |
| Conflict risk | Stale portfolio views |
| Financial risk | High if acted upon offline |
| Strategy | **Online Only**; optional future **Safe Cached** with explicit “as-of” stamp |

**Evidence:** `ExecutiveIntelligencePanel.tsx`, `useDashboardSummary.ts` vs executive endpoint.

**Class:** **Online Only**

### 11. Audit logs

| Question | Finding |
|----------|---------|
| Safe to cache? | Read cache possible later with caveats; not present |
| Safe to edit offline? | **Forbidden** — trail is server-authored |
| Requires online-only? | **Yes** |
| Conflict risk | Split-brain audit destroys trust |
| Financial risk | Integrity-critical |
| Strategy | **Online Only** |

**Evidence:** `auditService.ts`, `packages/domain/src/modules/audit/`.

**Class:** **Online Only**

### 12. Holidays

| Question | Finding |
|----------|---------|
| Safe to cache? | Lists can be cached |
| Safe to edit offline? | Request **create** via queue; approvals online |
| Requires online-only? | Approvals + org holiday admin **Yes** |
| Conflict risk | Schedule shifts after apply |
| Financial risk | Indirect (due dates) |
| Strategy | Create **Queue Required**; approve **Online Only** |

**Evidence:** `CollectorHolidayRequestsPanel.tsx`, `holidaySyncHandler.ts`, holiday-request routes.

**Class:** **Queue Required** (create) / **Online Only** (approve/admin)

### 13. Loan pools / disbursements / adjustments

| Question | Finding |
|----------|---------|
| Safe to cache? | Shell `/loan-pools` only |
| Safe to edit offline? | **No** |
| Requires online-only? | **Yes** |
| Conflict risk | Capital and cash-out collisions |
| Financial risk | **Critical** |
| Strategy | **Online Only** |

**Evidence:** loan-pools / loans / adjustments routes; absent from queue types.

**Class:** **Online Only**

---

## Classification matrix (summary)

| Module | Classification | Financial risk | Recommended near-term action |
|--------|----------------|----------------|------------------------------|
| Payments | Queue Required | Critical | Harden; keep conflict review |
| Expenses | Queue Required | High | Keep; evaluate SoD in Phase 7 |
| Holidays (create) | Queue Required | Indirect | Keep; approvals online |
| Notifications (inbox) | Safe Cached | Low | Keep snapshot; stamp freshness |
| Notifications (emit/prefs) | Online Only | Timing | Preserve confirmation-on-apply |
| Admin fees | Online Only | Critical | Do not queue yet |
| Reconciliations | Online Only | Critical | Do not queue decisions |
| Registration / drafts | Online Only | Low–Med | Local drafts only in later phase |
| Groups | Online Only | Med–High | No offline writes |
| Reporting | Online Only | High | No offline report engine |
| Exports | Online Only | High | Online jobs only |
| Executive dashboard | Online Only | High | Live fetch only |
| Audit logs | Online Only | Critical | Never offline-append |
| Pools / disburse / adjustments | Online Only | Critical | Online only |

**No module is classified Safe Offline** without queue/conflict controls given current money/schedule impact.

---

## Can offline-first be added without affecting production behaviour?

| Condition | Required |
|-----------|----------|
| Default-off feature flag | Phase 4 — e.g. `WILMS_OFFLINE_MODE=false` restores today’s behaviour |
| No new financial write types until simulation | Phase 7 gate |
| Receipt rule | Confirmation notifications only — no PDF/receipt tables |
| Shell/cache expansion | Must not change money math when flag off |
| Tests | Flag-off regression suite proving parity |

**Answer:** **Yes, if** integration is phased and flag-gated. Expanding queue coverage without those controls would **not** be safe.

---

## Integration risks for the existing production stack

1. **localStorage mutation queue** — durability weaker than IndexedDB under pressure.  
2. **Expense queue without conflict review** — asymmetric vs payments.  
3. **Confirmation delay** — borrowers receive `PAYMENT_CONFIRMED` only after successful apply; must remain explicit in UX.  
4. **Shell network-first navigations** — “offline shell” is not full offline HTML for every deep link.  
5. **Device certification residual** — see offline certification report.  
6. **Parallel UX branch (#184)** — merge carefully; offline docs branch should rebase after UX lands.

---

## Recommendation

Proceed to **Phase 2 — Offline Architecture Design** documenting target durable queue, flag boundary, and confirmation preservation — without implementing financial write expansion.

Preferred strategic direction (preview of Phase 8): **phased / collector-first** offline, not big-bang organisation-wide offline writes.

---

## Next phase

| Item | Value |
|------|-------|
| Deliverable | `OFFLINE_ARCHITECTURE_DESIGN.md` |
| Code changes | None in Phase 2 |
| Gate | Design must honour classifications in this document |
