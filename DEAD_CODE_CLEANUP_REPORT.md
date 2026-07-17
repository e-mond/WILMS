# Dead Code Cleanup Report

## Removed / Replaced in Active Paths

| Item | Action |
|---|---|
| `LoadingSpinner` in page/panel loading | Replaced with skeleton components |
| Duplicate toast dispatch paths | Consolidated via dedupe + baseline |
| Unused triple skeleton imports | Normalized to single import per file |

## Retained Intentionally

| Item | Reason |
|---|---|
| `LoadingSpinner.tsx` | Test coverage + export compatibility |
| `LoadingButton` spinner | Inline action feedback (not page loading) |
| Mock permission override store (frontend) | Demo mode when API disabled |

## Not Removed (requires separate sprint)

- Archive docs under `docs/archive/`
- Legacy page-validation manifests
- `Modal` vs Shadcn Dialog rename

## Verification

`npm run verify:mock-guard` — no forbidden mock imports in features.
