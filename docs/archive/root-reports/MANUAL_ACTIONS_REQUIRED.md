# MANUAL ACTIONS REQUIRED — WILMS

**This file contains ONLY items that require human/operator action.**

## A. Authenticated production verification (must use real accounts)
1. Provide real production credentials to run:
   - `npm run smoke:production -w @wilms/api`
     - set `WILMS_SMOKE_EMAIL`
     - set `WILMS_SMOKE_PASSWORD`
   - `npm run smoke:rbac -w @wilms/api`
     - set `WILMS_SMOKE_EMAIL` / `WILMS_SMOKE_PASSWORD` for Admin
     - set `WILMS_SMOKE_COLLECTOR_EMAIL` / `WILMS_SMOKE_COLLECTOR_PASSWORD`
     - set `WILMS_SMOKE_OFFICER_EMAIL` / `WILMS_SMOKE_OFFICER_PASSWORD`
2. Execute manual workflow smoke (role-based):
   - Login/logout, remember-me, password reset, MFA (if enabled), session expiry, App lock
   - Borrower registration → validation/uploads → approval → edits
   - Loan workflow: pool creation → borrower registration → loan creation → approval → disbursement → collection → reconciliation → completion
   - Expenses: create, operating cash deduction, collector history, reports/dashboard totals
   - Messaging chain: Super Admin → Collector, reply, notifications, read, history
   - Reports: exports CSV/Excel/PDF, audit logs, financial and loan reports

## B. Financial integrity live reconciliation (highest priority)
3. Run live reconciliation audit with production data access (requires operational DB context):
   - verify dashboard totals match ledger/reports exports
   - confirm all totals reconcile:
     - Pool Capital / Disbursed / Collected / Outstanding / Available Capital
     - Expenses / Operating Cash / Net Collections
     - Repayment Rate / Utilisation

## C. Backup, restore, and disaster recovery validation
4. Perform an actual Neon backup and restore drill:
   - `pg_dump` or platform-managed PITR backup
   - restore to a staging/branch DB
   - verify users, loans, expenses, pools, collections, reports, and audit logs exist and are queryable
5. Validate disaster recovery:
   - simulate database failure
   - restart application services
   - measure recovery time and document:
     - RPO (Recovery Point Objective)
     - RTO (Recovery Time Objective)
     - operator runbook steps and observed recovery behavior

## D. Browser, mobile, accessibility, and performance certifications
6. Run cross-browser compatibility checks on:
   - Chrome, Edge, Firefox, Safari (desktop)
   - Android Chrome, Samsung Internet
   - iPhone Safari
7. Complete WCAG 2.2 AA certification:
   - run axe/Lighthouse accessibility scans in production/staging
   - perform manual keyboard navigation, focus order, ARIA/name-role-value, and screen reader checks
8. Run Lighthouse/Core Web Vitals on production:
   - LCP, CLS, INP/FID, bundle size, and critical route timings

## E. Dependency vulnerability remediation decision
9. Review and decide dependency upgrades flagged by `npm audit --production`:
   - next (security advisories)
   - drizzle-orm (SQL injection advisory)
   - related transitive advisories (postcss/playwright/uuid)
10. If upgrades are applied, re-run:
    - unit tests
    - production health probe
    - authenticated smoke suite
    - security re-scan

