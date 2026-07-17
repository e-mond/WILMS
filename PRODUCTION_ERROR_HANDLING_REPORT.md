# Production Error Handling Report

## User-Friendly Errors

| Utility | Purpose |
|---|---|
| `lib/errors/user-friendly-error.ts` | Maps technical errors to safe copy |
| `utils/query-error-presentation.ts` | Existing query error titles (unchanged, already friendly) |
| `apiClient` | Session expired / permission messages |

Standard messages:

- “Something went wrong. Please try again.”
- “We couldn't save your changes.” (available via constants)
- “Your session has expired. Please sign in again.”
- “This action is not available right now.”

## Error Boundaries

| Route | File |
|---|---|
| Global | `app/error.tsx` |
| Dashboard | `app/(super-admin)/dashboard/error.tsx` |
| Reports | `app/(super-admin)/reports/error.tsx` |
| Daily collection | `app/(super-admin)/reports/daily-collection/error.tsx` |
| Settings | `app/(super-admin)/settings/error.tsx` |
| Loan pools | `app/(super-admin)/loan-pools/error.tsx` |
| Communication Center | `app/(super-admin)/communication-center/error.tsx` |

Shared component: `components/errors/RouteSegmentError.tsx`

## Logging

- Detailed errors sent to `errorTracking.captureException` in production boundaries.
- User-facing UI never renders raw stack traces.

## Browser Extension Noise

`ConsoleExtensionNoiseFilter` suppresses known extension `runtime.lastError` messages that are not app-generated.
