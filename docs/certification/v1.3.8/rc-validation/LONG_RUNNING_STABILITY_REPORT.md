# Long-Running Stability Report

**Date:** 17 July 2026

## Backend process longevity

| Concern | Finding |
|---|---|
| `setInterval` in API | **None** found |
| `setTimeout` | Shutdown force-exit (unref’d); mail/SMS retry backoff |
| In-process queue growth | Scheduled messages DB-backed; mail retries in-memory during request — process restart drops in-flight retries |
| WebSockets | Not a primary transport |
| Cache growth | No app-level Redis cache |
| Worker cleanup | N/A (no durable workers) |

## Frontend longevity

| Concern | Finding |
|---|---|
| Offline sync interval | Cleared on unmount (`useOfflineQueueSync`) |
| Upload processor | Cancel flag + clearInterval |
| API AbortController | Present in apiClient |
| Tour analytics localStorage | Capped to last 50 events |
| localStorage offline queue | Can grow if sync stuck — Medium risk |

## Months of uptime

API process can run indefinitely if:
- Neon stays healthy  
- Memory stable (no unbounded in-memory lists on hot paths — dashboard SQL helps)  

Risk: long-lived Node process with occasional large `list*` responses under scale; prefer pagination + workers for multi-month HA.

## Verdict

**No evidence of classic interval leaks** in API. Long-running enterprise HA still limited by **in-process side effects**, not by timer leaks.
