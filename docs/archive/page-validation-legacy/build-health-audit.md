# Build Health Audit

Recorded: 2026-06-09 after clean rebuild.

## Incident

**Error:** `Cannot find module './1682.js'` (stale webpack chunk reference)

**Root cause:** Corrupted or stale `.next` build artifacts after route/layout changes and interrupted dev builds.

## Remediation Performed

```powershell
taskkill /F /IM node.exe
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
npm install
npm run type-check
npm run lint
npm run build
```

**Result:** Clean build succeeded. All 39 app routes compiled.

## Chunk Audit

| Check | Status |
|---|---|
| Clean `.next` before build | Pass |
| Production build completes | Pass |
| No missing chunk references in `.next/server` | Pass |
| Shared chunks present (`2117-*.js`, `fd9d1056-*.js`) | Pass |

Dynamic import sites verified:

| File | Import target | Status |
|---|---|---|
| `risk-flags/page.tsx` | OverpaymentReviewPanel, RiskFlagsPanel | OK |
| `loan-pools/page.tsx` | LoanPoolsPanel | OK |
| `reports/page.tsx` | ReportsIndexPanel | OK |
| `settings/page.tsx` | SettingsPanel | OK |
| `WilmsExportActions.tsx` | excel-engine, pdf-engine (lazy) | OK |

## Route Audit

All role route groups compile:

| Group | Routes | Status |
|---|---|---|
| `(super-admin)` | dashboard, borrowers, settings, reports, ÔÇª | Pass |
| `(collector)` | collector/dashboard, settings, ÔÇª | Pass |
| `(registration-officer)` | officer/register, settings, ÔÇª | Pass |
| `(approver)` | approver/pending, settings, ÔÇª | Pass |
| `(auditor)` | auditor/reports, audit-log, settings | Pass |

## Dynamic Import Audit

- All `next/dynamic` imports resolve to existing modules.
- No renamed routes left with stale chunk IDs after clean build.

## Bundle Audit

- First Load JS shared: ~87.7 kB
- Largest route bundles: borrowers/groups (~557ÔÇô561 kB) ÔÇö expected for data-heavy panels
- No build warnings for missing modules

## Startup Audit

After clean build:

1. Run `npm run dev`
2. Load `/login`, `/dashboard`, `/collector/dashboard`, `/auditor/reports`
3. Confirm no ChunkLoadError in console

## Prevention

- Run clean rebuild after major route/layout refactors
- Stop dev server before renaming route groups
- Root `error.tsx` retains ChunkLoadError recovery for edge cases
