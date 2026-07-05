# Technical Debt Report

**Date:** 2026-07-05  
**Branch:** elease/v1.0.1-maintenance

## Resolved

| Item | Resolution |
|------|------------|
| Unused AppLockRequiredGate | Removed after confirming no source imports |
| Historical docs in root | Archived under docs/archive/v1.0.0-rc1.4/ |
| Historical phase reports in active docs path | Archived under docs/archive/page-validation/ |
| Verification output path pollution | Generated outputs redirected to docs/generated/ |
| Stale app-lock docs | Updated to optional app-lock behavior |

## Remaining debt

| Item | Risk | Next action |
|------|------|-------------|
| isError || !data UI patterns | Low/Medium | Refactor panel-by-panel with focused tests |
| Mock/demo infrastructure | Medium | Keep until test/dev replacement plan exists |
| One-time repair scripts | Low | Archive only after operations confirms no rollback need |
| Breaking dependency advisories | High | Dedicated hardening PR |
| Historical docs internal links | Low | Preserve as historical text; do not rewrite evidence content aggressively |
