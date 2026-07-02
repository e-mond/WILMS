# RC1.3.3 — HTTP 500 Analysis

| Route | Layer | Empty-DB code path | Production failure |
|-------|-------|-------------------|-------------------|
| `/dashboard/summary` | `dashboard/service.ts` | Zero KPIs when arrays empty | 500 — upstream SQL/legacy deploy |
| `/borrowers` | `borrowers/service.ts` | `[]` | 500 |
| `/loans` | `loans/service.ts` | `[]` | 500 |
| `/loans/portfolio` | `loans/service.ts` | `[]` | 500 |
| `/groups` | `groups/service.ts` | Empty summary | 500 |
| `/loan-pools` | `loan-pools/service.ts` | `buildListResponse([])` | 500 |
| `/collectors` | `collectors/service.ts` | Zero summaries | 500 |
| `/risk-flags` | `risk-flags/service.ts` | Zero flags | 500 |
| `/messages/threads` | `messages/service.ts` | `[]` | 500 (module absent on `cf3ce10`) |

**Evidence:** BFF and Railway both return 500 for `/borrowers` (not BFF-only). Error body: generic `"An unexpected error occurred."` (`SERVER` code).

**Fix:** Redeploy current `main`; if 500 persists, check `/health.schema.missingTables` and Railway logs after error-handler logging ships.
