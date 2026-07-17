# IDOR Review

**Date:** 17 July 2026  
**Method:** Route + service review of ownership checks on money and PII surfaces

## Closed this sprint

| Endpoint | Risk | Fix |
|---|---|---|
| `GET/POST /reconciliation(s)` | Collector A acts as B | Force `collectorId = session.userId` for `COLLECTOR` |
| `GET /reconciliations/:id` | Cross-collector read | Compare summary.collectorId to session |
| `POST /payments` | Post against unassigned borrower | `assertBorrowerReadAccess` for collectors |

## Previously present / reconfirmed

| Area | Control |
|---|---|
| Borrower reads | `assertBorrowerReadAccess` |
| Collector dashboard | Own-id binding in collector-portal |
| Expenses GET | Non-managers scoped to own user id |
| Loans | Permission + lifecycle; pool linkage server-side |

## Residual Medium items (not Critical/High)

- Messages / notifications / documents: rely on existing auth + permission gates; recommend dedicated ownership fuzz suite in next release.
- Optional Idempotency-Key remains a race risk (M-01), not classic IDOR.
