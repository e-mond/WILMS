# RC1.1 — Security Audit

**Date:** 2026-07-01  
**Scope:** Full RC1.1 stabilization branch

## Dependency scan

```bash
npm audit --audit-level=critical  # 0 critical (CI gate)
npm audit --audit-level=high      # 9 high — documented below
```

| Advisory | Package | Severity | Remediation |
|----------|---------|----------|-------------|
| SQL identifier escaping | drizzle-orm <0.45.2 | high | Upgrade post-v1.0.0 (breaking) |
| Next.js advisories | next 14.x | high | Upgrade to 15+ planned (TD-01) |
| Playwright SSL | playwright <1.55.1 | high | Dev dependency — upgrade e2e |
| form-data CRLF | form-data | high | `npm audit fix` when safe |
| glob CLI | glob | high | eslint-config-next chain — defer |

**Critical:** 0 — CI blocks merge on critical findings.

## Application controls

| Control | Status |
|---------|--------|
| Helmet + HSTS | PASS |
| CORS explicit origin | PASS |
| BFF CSRF | PASS |
| RBAC per-route | PASS (hotfix) |
| Collector self-access | PASS |
| Upload validation (Cloudinary) | PASS |
| gitleaks in CI | PASS |
| Production mock guard | PASS |
| Mock import guard (features) | PASS |

## OWASP-oriented review

| Risk | Mitigation |
|------|------------|
| XSS | React escaping; CSP nonce support in Next config |
| SQL injection | Drizzle parameterized queries; upgrade advisory tracked |
| CSRF | BFF synchronizer token |
| Broken access control | RBAC middleware + integration tests |
| Security misconfiguration | Env validation on API startup |

## Verdict

**PASS** — No critical findings; highs documented with remediation plan.
