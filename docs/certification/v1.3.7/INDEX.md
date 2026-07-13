# WILMS v1.3.7 Production Certification — Index

**Sprint date:** 2026-07-13  
**Release tag:** `v1.3.7`  
**Certification tag:** **NOT ISSUED** — see [Production Certification Report](./PRODUCTION_CERTIFICATION_REPORT.md)

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | [Production Certification Report](./PRODUCTION_CERTIFICATION_REPORT.md) | **NOT CERTIFIED** |
| 2 | [Smoke Test Report](./SMOKE_TEST_REPORT.md) | Partial |
| 3 | [Financial Integrity Report](./FINANCIAL_INTEGRITY_REPORT.md) | Local pass; prod blocked |
| 4 | [Security Audit Report](./SECURITY_AUDIT_REPORT.md) | Automated pass; prod auth blocked |
| 5 | [Accessibility Report](./ACCESSIBILITY_REPORT.md) | Code review; full audit blocked |
| 6 | [Performance Report](./PERFORMANCE_REPORT.md) | Bundle pass; Lighthouse blocked |
| 7 | [Backup & Recovery Report](./BACKUP_RECOVERY_REPORT.md) | Blocked (no Neon access) |
| 8 | [Disaster Recovery Report](./DISASTER_RECOVERY_REPORT.md) | Blocked (no infra access) |
| 9 | [Browser Compatibility Report](./BROWSER_COMPATIBILITY_REPORT.md) | Blocked (no real browsers) |
| 10 | [Mobile Compatibility Report](./MOBILE_COMPATIBILITY_REPORT.md) | Blocked (no devices) |
| 11 | [Go-Live Checklist](./GO_LIVE_CHECKLIST.md) | Open items remain |
| 12 | [Production Deployment Report](./PRODUCTION_DEPLOYMENT_REPORT.md) | Partial deploy |
| 13 | [Final Release Summary](./FINAL_RELEASE_SUMMARY.md) | Conditional |

## Production URLs

| Component | URL |
|-----------|-----|
| Frontend | https://wilms.vercel.app |
| API | https://wilms-production.up.railway.app |

## Critical blockers before go-live

1. Apply pending database migrations (`0023`–`0025` minimum; journal updated in this sprint).
2. Resolve schema probe failures (`organization_holidays`, `loan_fee_charges`, `loan_penalty_rules`).
3. Re-run `smoke:production` and `smoke:rbac` with production credentials after migrations.
4. Complete manual workflow smoke and financial reconciliation on live data.
