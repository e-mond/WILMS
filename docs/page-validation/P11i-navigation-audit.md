# P11i Navigation Governance Audit

## Desktop
- All role shells retain the persistent `md:flex` sidebar via `DashboardShell`.

## Mobile drawer + FAB
- **Super Admin**: `enableMobileNavDrawer` enabled — drawer + FAB remain available.
- **Operational roles** (Registration Officer, Approver, Auditor): `operationalMobileNav` disables drawer; bottom navigation only.
- **Collector**: explicit `enableMobileNavDrawer={false}`; bottom navigation only.

## Label corrections
- Mobile/status label uses **Online** (was Live).
- Collector nav label uses **Collector Fees** (was Admin Fees).

## Tests
- `src/tests/layouts/shells.test.tsx` verifies drawer absence for operational/collector shells and drawer presence for Super Admin.
