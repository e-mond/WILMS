# WILMS Failure Injection Report (Phase 9I)

**Product version:** 1.8.0  
**Language:** British English  

## Intended procedures

| Injection | Expected graceful behaviour | This run |
|-----------|-----------------------------|----------|
| Corrupted cache entry | Network fallback or login fallback | **BLOCKED** |
| Partial cache | Missing route → login/`/` fallback when flag on | **BLOCKED** |
| Deleted IndexedDB | Snapshots/uploads empty; queue may remain in localStorage | **BLOCKED** |
| SW unregister | App behaves as non-PWA network app | **BLOCKED** |
| Storage quota exceeded | Must not silently drop payment queue items | **BLOCKED** |
| Browser storage cleared | Re-login; empty queues | **BLOCKED** |
| Interrupted deploy / cache update | Update prompt / waiting worker | **BLOCKED** |
| Missing cached route | Flag-on navigate catch → `/login` or `/` | Code-reviewed only |
| Malformed cached response | Browser/network error UI | **BLOCKED** |

## Code-reviewed recovery hooks

- Activate deletes non-current cache keys.
- Navigate fallback chain: pathname → `/login` → `/`.
- Update prompt uses `SKIP_WAITING`.

No failure-injection experiments were executed against a live browser in this environment.
