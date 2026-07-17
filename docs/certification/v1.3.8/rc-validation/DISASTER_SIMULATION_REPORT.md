# Disaster Simulation Report

**Date:** 17 July 2026  
**Method:** Code/architecture behaviour analysis (no chaos engineering lab in this environment)

| Scenario | Observed / coded behaviour | Gap |
|---|---|---|
| Database restart / disconnect | `/health` → degraded + **HTTP 503** when DB configured but disconnected; API fails money ops | App does not auto-queue money writes |
| Queue / Redis failure | Redis **not used**; in-process jobs die with process | Durable queue needed for HA |
| Network interruption (BFF↔API) | BFF returns 503 UPSTREAM_UNAVAILABLE | Client retry/idempotency still optional |
| Payment interruption mid-txn | DB transaction rollback; optimistic version conflicts | Require Idempotency-Key to harden retries |
| Storage (Cloudinary) failure | Upload env invalid → health degraded; prod health HTTP 503 if uploads invalid | Document operator response |
| Email outage | Retries then FAILED status; user invite may still create account | Ops must monitor invitation FAILED |
| SMS outage | Soft-fail; logs failure | Field alerts may be missed |
| Partial deployment | Manual prod workflow; version sync checks exist | Prefer canary |
| Rollback | Deploy runbooks; migrations need forward-fix discipline | Document per-release |
| Power / process kill | In-flight in-process mail/SMS lost; HTTP scheduler misses ticks until next trigger | Infrastructure |
| Redis failure | N/A today | When introducing Redis, define fail-open vs fail-closed |

## Recommendations

1. Durable workers with DLQ before calling HA complete  
2. Mandatory Idempotency-Key on money POSTs  
3. Chaos drill checklist quarterly (restore + kill API mid-payment)  

## RC stance

Disaster behaviour is **understood and mostly fail-safe for money (txn rollback)**. Notification/job durability is the primary weakness — classified **Infrastructure / High for enterprise HA**, not a Critical financial correctness bug.
