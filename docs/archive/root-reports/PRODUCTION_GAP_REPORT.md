# PRODUCTION GAP REPORT — WILMS

**Audit date:** 2026-07-16  
**Audited code:** `main @ 10dfcbb`

## 1. Production gates: pass/fail/blocked (evidence-based)

### 1.1 Deployment + integrity gates
- Production deployment reachable (`/health`): **PASS**
  - `status=ok`
  - `schema.status=ok`
  - `migrations.status=ok`
- Migrations: **PASS**
  - health indicates migrations readiness status ok

### 1.2 Authenticated workflow gates (blocked here)
- `smoke:production` (real production credentials): **BLOCKED**
  - running without `WILMS_SMOKE_EMAIL/WILMS_SMOKE_PASSWORD` fails fast with:
    `WILMS_SMOKE_EMAIL and WILMS_SMOKE_PASSWORD are required for production smoke tests...`
- `smoke:rbac` (real production accounts per role): **BLOCKED**
  - running without per-role env vars fails fast similarly.

### 1.3 Financial integrity live reconciliation (blocked)
- Live reconciliation audit: **BLOCKED**
  - requires operational access to production data execution context.

### 1.4 Backup & restore (blocked)
- Backup integrity + restore verification: **BLOCKED**
  - requires Neon/Railway credentials and operator-run restore drill.

### 1.5 Disaster recovery drill (blocked)
- Database failure simulation / recovery timing (RPO/RTO): **BLOCKED**
  - requires infrastructure control and operator execution.

### 1.6 Accessibility certification (blocked)
- WCAG 2.2 AA axe/Lighthouse and manual keyboard/screen-reader testing: **BLOCKED**

### 1.7 Browser/mobile compatibility (blocked)
- No browser/device farm executed in this environment.

### 1.8 Performance certification (partial)
- Bundle budgets + build envelopes: **PASS**
- Lighthouse/Core Web Vitals on production URL: **BLOCKED** (requires browser tooling and authenticated sessions)

## 2. Net readiness conclusion

**Production infrastructure integrity is now green** (`/health ok`, schema OK, migrations OK).  
