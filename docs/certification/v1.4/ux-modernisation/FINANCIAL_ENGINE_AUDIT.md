# Financial Engine Audit — v1.4 UX Modernisation

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## Scope statement

This pack does **not** modify financial mutation services, ledger posting, reconciliation, admin-fee enforcement, pool capital hard stops, holiday shift logic, or expense operating-cash posting.

## Regression expectation

After merge, re-run (or rely on CI for):

```bash
npm run test -w @wilms/api
# plus existing verification harnesses when DATABASE_URL is available
```

## Controls that must remain closed

- Admin fee enforcement
- Approval before disbursement
- Pool capital hard stop / allocation
- Collection calculations & holiday-shifted due dates
- Reconciliation lifecycle & reversal accounting
- Immutable payments
- GPS collection requirements where configured
- Collector assignment binding
- SoD restrictions
- Dashboard single-source KPIs

**Status:** Not weakened by this UX delta. Full re-certification of live production finances remains operator-gated (see production cutover pack).
