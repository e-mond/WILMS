# Feature Cleanup Recommendations — v1.3.6-rc1

**Date:** 2026-07-12  
**Note:** Recommendations only — nothing deleted automatically in this RC.

---

## Remove (future)

| Item | Justification | Risk if removed now |
|------|---------------|---------------------|
| `ROLE_SETTINGS_SECTION.PIN` constant | No longer in any role nav | Low — grep before delete |
| `docs/archive/**` duplicate manifests | Historical only | None — archive |

## Merge

| Item | Into | Justification |
|------|------|---------------|
| `/collector/security` breadcrumb copy | `/collector/settings` | Redirect already in place — update breadcrumb map |

## Archive

| Item | Justification |
|------|---------------|
| v1.3.5 audit reports | Keep in repo; reference from v1.3.6 RC |

## Keep

| Item | Justification |
|------|---------------|
| `export-csv.ts` deprecated wrappers | Still imported |
| `MockDataProvider` | Required for local dev/demo |
| `DemoModeBanner` | Correctly hidden when `isDemoMode()` false in production |

## Already removed (v1.3.5)

- `export-group-profile.ts` — 0 imports
