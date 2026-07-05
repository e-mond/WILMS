# RC1 ÔÇö Report API Audit

**Gate:** GATE 2  
**Date:** 2026-06-30  
**Status:** COMPLETE

---

## Summary

Five report endpoints were **placeholder stubs** returning wrong schemas. RC1 implemented full domain logic using existing repositories.

| Endpoint | Before | After |
|----------|--------|-------|
| `GET /reports/loan-portfolio` | `{ rows, totals }` stub | `{ generatedAt, summary, entries }` from `listPortfolioEntries()` |
| `GET /reports/defaulters` | `{ rows: [] }` stub | Full defaulter report with schedule missed-week counts |
| `GET /reports/collector-performance` | `{ rows: [] }` stub | Mapped from `listCollectors()` |
| `GET /reports/group-risk` | `{ rows: [] }` stub | Mapped from `listGroupsResponse()` |
| `GET /reports/financial-ledger` | `{ rows: [] }` stub | Payments mapped with date filters |

---

## Implementation map

| Endpoint | Domain module | Data sources |
|----------|---------------|--------------|
| `/reports/loan-portfolio` | `domain/reports/loan-portfolio.ts` | `loans/service.listPortfolioEntries`, query `search/status/cycleBatch` |
| `/reports/defaulters` | `domain/reports/defaulters.ts` | `loan.repository`, borrowers, payments, `loan-schedule.repository` |
| `/reports/collector-performance` | `domain/reports/collector-performance.ts` | `collectors/service.listCollectors` |
| `/reports/group-risk` | `domain/reports/group-risk.ts` | `groups/service.listGroupsResponse` |
| `/reports/financial-ledger` | `domain/reports/financial-ledger.ts` | `listPayments`, `fromDate`/`toDate` filters |

---

## Tests

`apps/backend/src/tests/reports/domain.test.ts` ÔÇö 4 tests covering filter/summarize, collector mapping, group risk, ledger date filter.

---

## RBAC

All report routes require:

- `requireAuth`
- `requirePermission(PERMISSION.VIEW_REPORTS)`

---

## Empty vs defect

| Endpoint | Empty when | Verdict |
|----------|------------|---------|
| loan-portfolio | No loans in DB | Data-driven empty ÔÇö OK |
| defaulters | No `DEFAULTED` loans | Data-driven empty ÔÇö OK |
| collector-performance | No collectors | Data-driven empty ÔÇö OK |
| group-risk | No groups | Data-driven empty ÔÇö OK |
| financial-ledger | No payments in date range | Data-driven empty ÔÇö OK |

Prior stub responses were **implementation defects**, not data-driven empties.

---

## Sample contracts

**Loan portfolio (populated):**

```json
{
  "data": {
    "generatedAt": "2026-06-30T19:00:00.000Z",
    "summary": { "totalLoans": 12, "activeLoans": 8, "totalDisbursedPesewas": 1200000, "totalOutstandingPesewas": 450000 },
    "entries": [{ "id": "...", "borrowerName": "...", "status": "ACTIVE" }]
  }
}
```

**Defaulters (empty):**

```json
{
  "data": {
    "generatedAt": "2026-06-30T19:00:00.000Z",
    "summary": { "totalDefaulters": 0, "totalOutstandingPesewas": 0 },
    "rows": []
  }
}
```

---

**GATE 2 report verdict:** All five endpoints fully implemented. Legitimate empty datasets acceptable.
