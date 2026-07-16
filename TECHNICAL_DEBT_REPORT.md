# TECHNICAL DEBT REPORT — WILMS

**Audit date:** 2026-07-16  
**Audited code:** `main @ 10dfcbb`  
**Live deployment evidence:** `/health` reports `status=ok`

## 1. Current technical debt (evidence-based)

### 1.1 Security dependency risk (requires operator decision)
Running:
`npm audit --production`
reported vulnerabilities in transitive dependencies, including:
- `drizzle-orm` (SQL injection advisory; breaking fix suggested by audit tooling)
- `next` (multiple server component / request deserialization related advisories; audit suggests breaking upgrades)
- `postcss` (moderate XSS via CSS stringify; audit suggests breaking upgrade path via Next)
- `playwright` (high; SSL certificate verification advisory — dev/test dependency signal)
- `uuid` / `exceljs` (moderate; transitive upgrade suggested)

**Actionability:** audit tooling indicates fixes often require **breaking** upgrades. This sprint did **not** upgrade dependencies automatically to avoid introducing breaking runtime changes.

### 1.2 Missing production workflow executions
The code-level and schema-level readiness is now green (`/health` ok), but several enterprise gates were not executed here due to missing production operator credentials / infra access:
- authenticated production smoke
- role-by-role RBAC workflow tests (real accounts)
- backup/restore and DR drill
- browser matrix, mobile device validation, and full WCAG axe/Lighthouse runs

These gaps are not code debt; they are certification execution gaps.

## 2. Removed “known debt”

This audit/hardening sprint removed two concrete sources of production risk:
- ESLint warning in `ProductTourOverlay` fixed via `useMemo` steps stabilization.
- Frontend XSS hardening added for rich-text preview rendering using a sanitizer util.

## 3. Debt score (qualitative)

| Type | Score | Rationale |
|---|---:|---|
| Code-level debt | Low–Moderate | Static checks are clean; security fixes applied. |
| Dependency debt | Moderate | `npm audit` flags breaking upgrade paths. |
| Operational debt | Moderate–High | Several human/infrastructure gates not executed. |

