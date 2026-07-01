# RC1 Security Audit

**Date:** 2026-07-01

## Dependency scan

| Level | Count | CI gate |
|-------|-------|---------|
| Critical | **0** | `npm audit --audit-level=critical` — PASS |
| High | 9 | Documented — no blind `npm audit fix --force` |
| Moderate | 9 | Documented |

### Notable high findings (remediation planned)

- `next@14.2.x` — multiple advisories; upgrade to Next 15+ requires dedicated migration sprint
- `drizzle-orm` — SQL identifier escaping; evaluate upgrade to 0.45.2+ in separate PR
- `playwright@1.48` — dev-only; upgrade in E2E maintenance window

## Application security

| Control | Location | Status |
|---------|----------|--------|
| Helmet | `apps/backend/src/http/app.ts` | Enabled in production |
| CORS | `env.corsOrigin` | Configured |
| Rate limiting | `express-rate-limit` on auth | Verified |
| CSRF | BFF proxy + server validation | Verified |
| Auth middleware | `requireAuth`, `requirePermission` | All business routes |
| Upload validation | Cloudinary adapter + size limits | Verified |
| Secret scan | gitleaks in CI | PASS |

## Verdict

No critical vulnerabilities. High/moderate items documented for post-RC1 remediation. CI security job passes.
