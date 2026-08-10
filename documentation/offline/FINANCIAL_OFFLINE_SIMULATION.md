# WILMS Financial Offline Simulation

**Product version:** 1.8.0  
**Phase:** 7 — Financial simulation (analysis; no new money write types)  
**Language:** British English  
**Depends on:** Phase 1 safety matrix, existing sync/idempotency code  

## Purpose

Decide whether offline **payments** (and any expansion) are safe enough to deepen or broaden, without inventing device results that were not run.

## Scenarios (desk simulation against code)

| Scenario | Mechanism in repo | Residual risk | Verdict |
|----------|-------------------|---------------|---------|
| Duplicate payment replay | Idempotency key = queue item id; `runWithIdempotency` | Key loss if queue item rewritten | **Mitigated** if keys stay stable |
| Interrupted sync | Item remains pending/failed; manual/auto retry | Partial apply without ack | Server idempotency must win |
| Network flapping | Drain on reconnect + background sync tag | Double drain races | Prefer single-flight drain (Phase 3F) |
| Concurrent collectors | Different collectors / loans | Same-loan multi-device | Conflict review for payments |
| Stale borrower data | Snapshots are read-only | Wrong amount UX | Do not trust snapshot for money |
| Holiday schedule changes | Holiday create queued; approvals online | Applied holiday shifts dues after sync | Acceptable with UX warning |
| Reconciliation during offline | Decisions online-only | Collector may draft later (3E) | **Do not** auto-submit recon |
| Admin fee interactions | Online-only today | Fee unlocks disbursement | **Keep online-only** |
| Notification timing | `PAYMENT_CONFIRMED` after apply | Delayed borrower receipt | Expected; not a PDF gap |

## Decision

| Question | Answer |
|----------|--------|
| Are **existing** offline payments acceptable to keep? | **Yes**, with Approver conflict review and idempotency — already production behaviour |
| Should we **expand** offline writes (admin fee, recon decisions, pools, disbursements)? | **No** — not until device Phase 6 matrix + stronger durable queue (IndexedDB) and explicit SoD design |
| Should we deepen payment queue durability (3D)? | **Yes, after** flag-on manual tests — design-only until then |
| Expense queue without conflict review | **Retain** for now; revisit SoD in a dedicated review — do not silently change in this sprint |

## Payment confirmation (“receipt”)

Offline mode must not introduce printable receipts. After successful apply (online or post-sync), existing `emitPaymentConfirmedNotification` remains authoritative.

## Gate for later phases

| Gate | Required before |
|------|-----------------|
| Manual Phase 6 airplane matrix with flag on/off | Enabling `WILMS_OFFLINE_MODE` in production |
| IndexedDB queue migration tests | Calling Phase 3D “done” |
| Explicit SoD design | Queuing admin fees or changing expense conflict policy |

## Next

Phase 8 — final recommendation (A–E).
