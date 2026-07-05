# RC1.4 ÔÇö Performance Verification

**Date:** 2026-07-04

## Budget checks

| Check | Script | Threshold |
|-------|--------|-----------|
| Bundle size | `npm run bundle:budget-check` | CI gate |
| Performance budget | `npm run perf:budget-check` | CI gate |

## Production encoding

Production smoke verifies Brotli JSON responses on dashboard, borrowers, and collectors BFF proxy routes.

## Empty database

All list endpoints return empty structures without 500 errors (RC1.3.3 + RC1.4 verification).
