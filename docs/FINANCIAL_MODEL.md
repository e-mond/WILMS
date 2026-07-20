# WILMS Financial Model — v1.4.1

**Date:** 2026-07-20  
**Detail calculations:** [`financial-calculations.md`](./financial-calculations.md)  
**Integrity audit:** [`certification/v1.4/final-system-audit/FINAL_FINANCIAL_INTEGRITY_AUDIT.md`](./certification/v1.4/final-system-audit/FINAL_FINANCIAL_INTEGRITY_AUDIT.md)

---

## Product model

WILMS manages **women’s interest-free loans**. There is no interest accrual engine. Money is tracked in **pesewas** (integer); UI displays via currency components.

WILMS is **not** a statutory double-entry GL. Operational pool ledgers and payment journals are the system of record for programme operations.

---

## Core money chain

1. **Registration / approval** of borrower and loan (role-gated).  
2. **Admin fee** confirmed before disbursement.  
3. **Pool capital** hard-stops disbursement when insufficient.  
4. **Disbursement** writes pool allocation (`DISBURSEMENT`).  
5. **Collections** — full weekly amount rules; oldest obligation first; GPS on field capture; same-day edit window for collectors; immutability after day ends.  
6. **Reversals** unwind allocations and payment state under controlled paths.  
7. **Expenses** affect operating cash, not loan principal.  
8. **Reports / dashboard** — org KPIs prefer SQL aggregates; oversized unpaginated report lists **422** (fail closed).

---

## Pool ledger (summary)

| Event | Effect |
|-------|--------|
| Replenishment | Increases capital |
| Disbursement | Increases disbursed / reduces available |
| Repayment | Increases collected / reduces outstanding |
| Adjustment | Audited capital correction (SoD residuals exist) |

Formulas: see `financial-calculations.md`.

---

## Integrity posture (v1.4.1)

| Control | Status |
|---------|--------|
| Admin fee, pool hard stop, payment immutability, GPS, reversal unwind | Conditional pass — **Verified** in prior + current code |
| SQL dashboard KPIs | **Verified** |
| Report truncation refusal | **Verified** this branch |
| Adjustment self-approve / expense self-post APPROVED | Residual Medium |
| Large-history SQL report aggregations | Residual / roadmap |

---

## Explicit non-claims

- No Production Certified financial seal for v1.4.1.  
- No live production cash reconcile attached in the final-system-audit pack.
