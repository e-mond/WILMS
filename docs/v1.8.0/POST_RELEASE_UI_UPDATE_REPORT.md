# WILMS v1.8.0 — Post-Release UI Update Report

## Release

```text
Existing release: v1.8.0
Release tag: UNCHANGED
Update type: Post-release update
Branch: fix/v1.8.0-ui-modernisation
```

## Changes

1. CI: fixed TS2556 in `push-inapp-preferences.test.ts` with typed `Parameters<typeof shouldSendChannel>`
2. Shared `DataTable` mobile stack layout + denser tokens / KPI / pill badges
3. Removed navbar Help + connection chips; floating Help FAB / connection chrome removed (HelpMenuModal retained for tour/uiStore)
4. Super Admin dashboard modernised (KPIs → needs attention → recon/activity → summaries)
5. Collector dashboard: removed quick-action grid, sticky quick payment/reconcile, sync status KPIs
6. Approver home: compact counters only (no explanatory action tiles)
7. Role workspace heroes: removed Online/sync pills
8. Reconciliation: calmer collector form; review queue with filters, status pills, stack mobile, detail drawer
9. Executive: removed Board guidance tab
10. Communication Center: inline two-column compose console with preview + send confirmation
11. Raise Flag: entity search replaces Entity ID free-text (internal `entityId` retained)
12. Docs/CHANGELOG updated under v1.8.0 identity; scheduler-http hook timeout hardened

## Tests

```text
Type-check: passed (npm run type-check)
Lint: passed (npm run lint)
Backend: n/a (thin adapter; domain covers API)
Frontend: passed (npm test — shards 270 + 268)
Domain: passed (245 tests / 80 files)
Build: passed (npm run build)
Financial: passed (financial-integrity-p0 + financial-endpoints-rbac in domain suite)
RBAC: passed (domain RBAC suites including collector portal / borrower list)
Offline: passed (OfflineBanner + offline queue tests in frontend suite)
Accessibility: intent preserved (labels, focusable table region, modal focus trap unchanged); no dedicated a11y runner executed this pass
Migration: none required / none applied
```

## Migration

```text
Required: NO
Migration: none
Applied: n/a
```

## Security

Navbar chrome removal only; Help menu still gated by auth/uiStore. Raise Flag still posts internal entity IDs. No CSP/auth/RBAC matrix changes.

## Financial integrity

Financial calculation logic was **not** modified. UI continues to consume authoritative API values.

## Documentation

- `CHANGELOG.md` (1.8.0 post-release section)
- `docs/v1.8.0/POST_RELEASE_UI_UPDATE_REPORT.md`
- `docs/v1.8.0/DASHBOARD_REDESIGN_REPORT.md`
- `docs/v1.8.0/V18_ENTERPRISE_DESIGN_REPORT.md`
- `docs/v1.8.0/UPDATED_PRODUCT_BOOK.md`
- `docs/v1.8.0/UPDATED_TECHNICAL_GUIDE.md`
- `docs/v1.8.0/README.md`
- `docs/v1.8.0/TEST_EVIDENCE_MANIFEST.json`

## Remaining issues

Addressed in `fix/v1.8.0-production-readiness` (see [`PRODUCTION_READINESS_MATRIX.md`](./PRODUCTION_READINESS_MATRIX.md)):

- ShellNavIcon duplicate `messages` case removed
- Selective DataTable stack rollout completed for ops lists
- README uplifted to 1.8.0; offline root doc synced

Still residual after production-readiness closure:

- Full visual QA across every listed viewport size not automated
- Manual offline device smoke not executed in agent environment
- Playwright a11y webServer may fail when build-time Google font CDN is unreachable

## Final verdict

Post-release UI unit: **READY FOR STAGING**  
Production-readiness closure: **READY WITH CONDITIONS** (see matrix)
