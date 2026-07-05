# RC1 ÔÇö Final Acceptance

**Date:** 2026-07-01  
**Release candidate tag:** `v0.2.2-rc1`

---

## Stop gates

| Gate | Deliverable | Status |
|------|-------------|--------|
| GATE 1 | `RC1-content-decoding-rca.md` | COMPLETE |
| GATE 2 | `RC1-report-api-audit.md`, `RC1-api-integrity.md` | COMPLETE |
| GATE 3 | `RC1-functional-audit.md` | COMPLETE |
| GATE 4 | Loading, responsive, version, session, notifications, console audits | COMPLETE |
| GATE 5 | Production validation, repository cleanup classification | COMPLETE |
| GATE 6 | PR #35 hotfix ÔÇö Vercel/CI lint (`vitest.d.ts`) | COMPLETE |
| GATE 7 | RC1 audit set (api, auth, email, sms, security, perf, system) | COMPLETE |
| GATE 8 | CI Node.js 22, production UX string cleanup | COMPLETE |

---

## Critical fixes

1. **ERR_CONTENT_DECODING_FAILED** ÔÇö BFF proxy header sanitization
2. **Five report stubs** ÔÇö Full domain implementations with tests
3. **Version drift** ÔÇö `OfficeShell` hardcoded `v2.4.1` removed
4. **Online badge** ÔÇö Static navbar badge removed; `ConnectionStatusChip` retained
5. **Silent API fallbacks** ÔÇö Removed per golden rule
6. **Vercel build** ÔÇö jest-dom vitest types without custom `vitest.d.ts` (PR #35)
7. **Dashboard mock data** ÔÇö Live group risk KPIs (PR #33)
8. **Settings 404** ÔÇö BFF URL normalization (PR #33)

---

## Acceptance criterion

**Release Candidate Accepted** pending:

- Production deploy verification (Vercel + Railway)
- `npm run smoke:production` 17/17
- Post-deploy curl confirms no `Content-Encoding` mismatch on BFF

---

## Tag

```bash
git tag v0.2.2-rc1
```

Apply only after stakeholder approval of production verification.
