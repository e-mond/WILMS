# RC1.1 — Implementation Matrix

**Date:** 2026-07-01

| Area | Status | Evidence |
|------|--------|----------|
| BFF content decoding | **Complete** | `RC1-content-decoding-rca.md`, smoke encoding checks |
| Collector portal RBAC | **Complete** | Hotfix `8e0df23`, `RC1.1-collector-audit.md` |
| API integrity 132/132 | **Complete** | CI `verify:api-integrity` |
| Mock isolation | **Complete** | `verify:mock-guard` |
| Approver workflows | **Complete** | `RC1.1-approver-audit.md` |
| Super admin surfaces | **Complete** | `RC1.1-super-admin-audit.md` |
| Loading UX (high-traffic) | **Complete** | `RC1.1-loading-ux.md` |
| Connection status chip | **Complete** | Online/offline/reconnecting/sync pending |
| Session / CSRF | **Complete** | `RC1.1-session-audit.md` |
| Stale bundle mitigation | **Complete** | SW v2, vercel cache headers, error boundary |
| SMS/email workflows | **Deferred** | TD-07 — adapters only |
| Next.js 15 upgrade | **Deferred** | TD-01 — breaking change |
| Server session revocation | **Deferred** | TD-04 |
| Playwright in CI | **Deferred** | TD-08 — local e2e only |
| v1.0.0 tag | **Pending** | Stakeholder sign-off after PR merge |

## Technical debt

See `RC1.1-technical-debt.md`.
