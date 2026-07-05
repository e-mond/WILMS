# RC1.4 ÔÇö Repository Cleanup

**Date:** 2026-07-04

## Actions taken

| Item | Action |
|------|--------|
| Decorative role settings controls | Removed from overflow (no fake toggles) |
| Navbar connection chip duplicate | Removed from mobile overflow |
| Superseded deploy env guidance | Platform SHA precedence documented |
| Mock layer | Retained for dev; production uses `index.production.ts` alias |

## Retained (operational)

| Script | Reason |
|--------|--------|
| `repair-production-schema.mjs` | Ops runbook for migration journal drift |
| `cleanup-demo-financial-data.mjs` | Operator tool for demo data removal |

## Archive candidates (post-merge)

- `docs/page-validation/phase-*-evidence/`
- Duplicate responsive audit versions (v2/v3)
- Superseded `p14-6-3-auth-probe.mjs`, `p14-6-4-api-matrix.mjs`
