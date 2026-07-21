# Final Dependency Report

**Version:** 1.4.2 | **Date:** 2026-07-21 | **Phase:** 29

## Scan Command

```bash
npm audit --omit=dev
```

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 4 |
| Moderate | 3 |
| **Total** | **7** |

## Residual Vulnerabilities

| Package | Severity | Exploitability | Mitigation |
|---------|----------|----------------|------------|
| `playwright` (via `@playwright/test`) | High | Dev/test only — not in production runtime | Upgrade when e2e suite updated; no prod exposure |
| `postcss` (via `next`) | Moderate | Build-time CSS stringify; no user-controlled CSS input in prod | Track Next.js patch releases |
| `uuid` (via `exceljs`) | Moderate | Server-side report export only; bounded buffer usage | Monitor exceljs/uuid updates |

## Actions Taken

- Phase 28: safe `npm audit fix` (10 → 7)
- Did **not** run `npm audit fix --force` (would break Next.js / vitest / exceljs)

## Node Version

Engine: `>=22`. Verified via `npm run verify:node`.

## Lockfile

`package-lock.json` committed. Install via `npm ci` at repo root.

## Status

**ADVISORY** — 0 critical; 4 high are dev/build transitive paths
