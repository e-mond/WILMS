# Phase 28I — Load & Performance Report

**Date**: 2026-07-21  
**Status**: BLOCKED for live tests — code-level improvements documented

## Code-Level Performance Improvements (Completed)

### Phase 27 Improvements

| Area | Change | Impact |
|------|--------|--------|
| Expense summary | SQL aggregation (`SUM CASE WHEN`) replacing in-memory scan | O(1) vs O(n) |
| Daily collection report | Date-scoped SQL query replacing full-table load | Avoids 2000-row cap |
| Financial ledger | Date-scoped SQL query replacing full-table load | Avoids 2000-row cap |

### Phase 28 Improvements

| Area | Change | Impact |
|------|--------|--------|
| Defaulter report | Full SQL aggregation with CTEs replacing N+1 per-loan queries | O(1) SQL vs O(n) round trips |
| Last payment date | SQL `MAX(payment_date)` CTE replacing per-borrower payment scan | Eliminates N queries |
| Missed weeks count | SQL `COUNT WHERE status=MISSED` CTE replacing per-loan schedule load | Eliminates N queries |

### Known Potential Bottlenecks

| Issue | Location | Status |
|-------|----------|--------|
| `sumLedgerRepayments` fetches all ledger rows in-memory | `loan.repository.ts:125` | Residual Medium — low frequency |
| Collector performance: per-collector stats assembled from multiple queries | `collectors/service.ts` | Residual — acceptable for current scale |
| Payment repository list cap | 2000 rows default | Mitigated for reports; still applies to raw list endpoints |

## Live Load Test Requirements

**BLOCKED** — requires staging environment with k6, Artillery, or equivalent.

### Test Scenarios to Execute

```bash
# Install k6
brew install k6

# Scenario: 50 concurrent collectors recording payments
k6 run --vus 50 --duration 60s scripts/load/payment-recording.js

# Scenario: 10 concurrent report viewers
k6 run --vus 10 --duration 30s scripts/load/reports.js
```

### Metrics to Capture

| Metric | Target |
|--------|--------|
| Login p95 latency | < 500ms |
| Dashboard p95 latency | < 1000ms |
| Collection recording p95 | < 800ms |
| Daily collection report p95 | < 2000ms |
| Error rate under load | < 0.1% |

## Verdict

Code-level O(n) → SQL aggregations: **COMPLETED**  
Live load test evidence: **BLOCKED / OPERATOR REQUIRED**
