# RC1.3 — Empty State Review

**Git SHA:** RC1.3 working tree on `release/rc1-3-final-certification`  
**Date:** 2026-07-02T18:50:00Z  
**Result:** **PASS** (code) / production UX blocked by API 500s

## Problem statement

Empty datasets (HTTP 200, `[]` or zeroed summaries) were often shown as connection errors via `isError || !data` and hard-coded "Check your connection" copy.

## Implementation

| Change | Path |
|--------|------|
| Error classification utility | `apps/frontend/src/utils/query-error-presentation.ts` |
| Shared empty copy | `apps/frontend/src/constants/empty-state-copy.ts` |
| Enhanced `QueryStatePanel` | Accepts `error`, `isForbidden`, derives titles/messages |
| Panel bulk fix | Removed `isError \|\| !data` anti-pattern across 24 feature panels |
| Timeout copy | Neutral message (no false connection blame) |
| Unit tests | `src/tests/utils/query-error-presentation.test.ts` |

## Error differentiation

| Condition | UX |
|-----------|-----|
| Empty dataset | Domain-specific empty state (e.g. "No borrowers yet") |
| Network offline | "Unable to reach the server" |
| 403 Forbidden | "Access denied" |
| 404 Not found | "Not found" |
| 500 Server | "Server error" + retry |
| Timeout | "Taking longer than expected" + retry |

## Remaining copy debt

Some legacy panels still use static connection strings in `errorMessage` props — superseded where `error={error}` is passed to `QueryStatePanel`.

## Pass gate

Empty successful responses must not display connection errors. **PASS** in code; verify on production after API 500 fix.
