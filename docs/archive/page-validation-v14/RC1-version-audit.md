# RC1 — Version Audit

**Gate:** GATE 4  
**Date:** 2026-06-30

---

## Single source of truth

Root `package.json` → `"version": "0.2.2"`

Propagated via `apps/frontend/next.config.mjs` → `NEXT_PUBLIC_APP_VERSION`

---

## Surfaces

| Surface | Mechanism | Status |
|---------|-----------|--------|
| Sidebar | `getAppVersionLabel()` via `AppSidebar` | PASS |
| Footer | `OfficeShellFooter` | PASS |
| Login | `AppVersionBadge` | PASS |
| Settings aside | Application version row | PASS |
| `/health` | `apps/backend/package.json` | PASS |
| OfficeShell | **Was** hardcoded `v2.4.1` | **FIXED** → `getAppVersionLabel()` |

---

## Release tag

RC1 acceptance tag: `v0.2.2-rc1` (git tag only; no package.json bump until final release)

---

## Verification

```bash
npm run verify:version
```

---

**Verdict:** Version consistency restored across UI surfaces.
