# RC1 — Final Acceptance

**Date:** 2026-06-30  
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

---

## Critical fixes

1. **ERR_CONTENT_DECODING_FAILED** — BFF proxy header sanitization
2. **Five report stubs** — Full domain implementations with tests
3. **Version drift** — `OfficeShell` hardcoded `v2.4.1` removed
4. **Online badge** — Static navbar badge removed; `ConnectionStatusChip` retained
5. **Silent API fallbacks** — Removed per golden rule

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
