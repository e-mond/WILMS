# Shadcn Migration Report

WILMS uses custom UI primitives styled to match Shadcn patterns. There is no `components.json`; migration means consolidating on the existing design-system components.

## Migration Matrix

| Custom Component | Shadcn Replacement | Status |
|---|---|---|
| `Button` | Shadcn Button pattern | ✅ In use (custom) |
| `Input` | Shadcn Input | ✅ In use |
| `Select` | Shadcn Select | ✅ In use |
| `Modal` | Shadcn Dialog | ⚠️ Custom Modal (API stable) |
| `Drawer` | Shadcn Drawer/Sheet | ⚠️ Custom Drawer |
| `Tabs` | Shadcn Tabs | ✅ In use |
| `Tooltip` | Shadcn Tooltip | ✅ In use |
| `Switch` | Shadcn Switch | ✅ In use |
| `Checkbox` | Shadcn Checkbox | ✅ In use |
| `Radio` | Shadcn Radio Group | ✅ In use |
| `Pagination` | Shadcn Pagination | ✅ In use |
| `Skeleton` | Shadcn Skeleton | ✅ Standardized v1.3.8 |
| Toast (`ToastContainer`) | Shadcn Toast/Sonner pattern | ✅ Custom store-based |
| `DataTable` | Shadcn Table + app layer | ✅ Executive tables |
| `LoadingSpinner` | Shadcn Skeleton | ✅ Removed from loading paths |

## Duplicate Libraries

No additional component libraries introduced. Single source: `apps/frontend/src/components/ui/` + `components/feedback/`.

## Recommendation

Future sprint: rename `Modal` → `Dialog` wrapper for Shadcn API parity without breaking imports.
