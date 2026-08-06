# Error Handling Report — v1.7.1

## Standards

| Layer | Requirement |
| --- | --- |
| User-facing | Friendly copy, retry, no stack/SQL/Prisma |
| Loading | Skeletons / contextual busy states |
| Empty | Guided empty (what / why / next) |
| Success | Inline confirmations / toasts (existing) |

## Applied in this sprint

- Recent Activity: skeleton + guided empty + friendly error/retry
- Operational Dashboard: guided empty for zero borrowers
- QueryStatePanel retained as the global query wrapper

## Framework utilities

- `QueryStatePanel`
- `GuidedEmptyState`
- `resolveQueryErrorPresentation`
- `constants/empty-state-copy.ts`

## Follow-up

Propagate GuidedEmptyState to remaining list pages still using bare EmptyState.
