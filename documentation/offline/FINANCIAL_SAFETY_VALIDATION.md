# WILMS Financial Safety Validation (Phase 9G)

**Product version:** 1.8.0  
**Language:** British English  
**Rule:** Do **not** implement new offline payment writes in this phase.

## Queue inventory (authoritative)

Only these client queue types exist (`apps/frontend/src/types/offline-queue.ts`):

- `RECORD_PAYMENT`
- `RECORD_EXPENSE`
- `HOLIDAY_REQUEST_CREATE`

Phase 5 / `WILMS_OFFLINE_MODE` **does not** add financial queue types. Flag-gated behaviour is shell navigate fallback only.

## Simulation desk results (code-backed)

| Scenario | Can it invent a ledger event while offline? | Notes |
|----------|-----------------------------------------------|-------|
| Payment screen offline | **No new path** | Existing queue may enqueue payment; apply happens on sync / conflict review |
| Collection interrupted | Item stays pending/failed until sync | Idempotency key = queue item id |
| Stale borrower / schedule | Read risk only | Snapshots are not money truth |
| Holiday changes offline | Holiday **create** may queue; approvals online | Indirect schedule impact after apply |
| Reconciliation draft offline | Decisions online-only per Phase 1 | No recon decision queue type |
| Duplicate submission | Mitigated by idempotency when keys stable | |
| Browser restart mid-payment | Queue in localStorage may retain item | Device proof **BLOCKED** |
| Admin fee / pools / disburse / adjustments | **No queue type** | Online-only |

## Confirmation / receipt

Payment “receipt” remains `PAYMENT_CONFIRMED` notification after successful apply — not PDF. Offline mode must not invent printable receipts (unchanged).

## Verdict

Current flag-off / Phase 5 shell work **does not accidentally create financial events by itself**. Existing payment queue remains the only money write path offline and is subject to Approver conflict review. Expanding that path (Phase 3D hardening) still requires device evidence from 9A–9B.
