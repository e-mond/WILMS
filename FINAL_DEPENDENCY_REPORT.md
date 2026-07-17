# FINAL_DEPENDENCY_REPORT.md

**Version:** 1.3.8 · **Date:** 2026-07-17

## Changes

| Action | Package | Notes |
|---|---|---|
| Removed | root `vitest` | Redundant; apps declare their own |

## Audit Snapshot

`npm audit` reports **18 vulnerabilities** (9 moderate, 9 high) after install. Addressing all requires `npm audit fix --force` with **breaking** upgrades (e.g. Next major).

**Classification:** External / upgrade sprint — not silently applied under feature freeze.

## Bundle

- Shared First Load JS ≈ **87.7 kB** (production build)
- `lucide-react` optimized via `optimizePackageImports`
- No duplicate UI libraries introduced

## Safe Upgrade Candidates (flagged, not applied)

| Package | Risk |
|---|---|
| `next` major | HIGH — breaking |
| `exceljs` / `uuid` | MEDIUM — audit-driven |
| Drizzle minor | Evaluate against migrations |

## Verdict

Dependencies are lean enough for maintenance. CVE closure requires a dedicated upgrade PR with full regression — **Infrastructure/External Service** class, not a code defect.
