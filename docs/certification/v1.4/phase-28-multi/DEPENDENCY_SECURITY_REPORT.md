# Dependency Security Report

**Version:** 1.4.2 | **Date:** 2026-07-21  
**Command:** `npm audit --omit=dev`

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 4 |
| Moderate | 3 |
| **Total** | **7** |

Safe `npm audit fix` (no `--force`) applied in prior pass: 10 → 7.

## Residual Vulnerabilities

| Package | Severity | Production Reachable | Action |
|---------|----------|---------------------|--------|
| drizzle-orm | High | Low (static identifiers) | Upgrade PR to ≥0.45.2 |
| next | High | Medium (self-hosted DoS) | Next 15/16 project; restrict image domains |
| @playwright/test | High | None (devDep) | Upgrade in dev tooling sprint |
| postcss (via next) | Moderate | None (build time) | With next upgrade |
| uuid (via exceljs) | Moderate | Low | Test exceljs@3.4.0 |

## Policy

No `npm audit fix --force`. Breaking upgrades require dedicated branches.

## Status

**ACCEPTED RESIDUAL** — documented, no exploitable critical path identified in current usage
