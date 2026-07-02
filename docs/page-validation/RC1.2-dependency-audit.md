# RC1.2 — Dependency Audit

**Git SHA:** `e456febebf509d2672ea79741b6e9a59463de10d`  
**Date:** 2026-07-02T10:30:00Z  
**Branch:** `release/rc1-1-production-stabilization`  
**Commands run:**

```bash
npm audit --audit-level=critical
npm audit --audit-level=high
npm outdated --long
npx depcheck
```

**Result:** PASS (0 critical; highs documented)

## Summary

| Tier | Count | Gate |
|------|-------|------|
| Critical | **0** | PASS (CI gate) |
| High | **9** | Documented — non-blocking with mitigations |
| Moderate | **9** | Documented |
| **Total** | **18** | No `npm audit fix --force` applied |

## High advisories (non-blocking)

| Package | Advisory | Mitigation / owner |
|---------|----------|-------------------|
| `drizzle-orm` <0.45.2 | SQL identifier escaping (GHSA-gpj5-g38j-94v9) | TD-02 — upgrade matrix before bump |
| `next` 14.x | Multiple DoS/XSS advisories | TD-01 — stay on 14.2.35; Vercel-hosted; no self-hosted Image Optimizer abuse |
| `playwright` <1.55.1 | SSL cert verify on browser download | Dev-only; CI uses pinned chromium |
| `form-data` 4.x | CRLF injection | Transitive; monitor upstream |
| `glob` 10.x | CLI injection | Dev-only via eslint-config-next |
| `esbuild` ≤0.24.2 | Dev server request leak | Dev/build only |

## Deferred (RC1.1 technical debt)

| ID | Item |
|----|------|
| TD-01 | Next 15 upgrade — requires compatibility matrix |
| TD-02 | Drizzle 0.45.2 — breaking change |

## `npm outdated` (top-level highlights)

- `next` 14.2.35 → 15.x available (future)
- `drizzle-orm` behind latest 0.45.x (future)
- `@playwright/test` behind 1.61.x (dev)

## `depcheck`

```
Unused devDependencies: vitest (root — used by workspace test scripts)
```

No unused production dependencies flagged.

## Pass gate

0 critical vulnerabilities; all highs classified with remediation plan; no forced breaking upgrades.
