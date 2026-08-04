# Toast Duplication Root Cause

## Symptom

The same notification toast appeared twice on login, page refresh, tab return, and React Strict Mode remounts.

## Root Cause

1. **Baseline race in `NotificationSoundBridge`:** Unread count could initialize before the inbox baseline was recorded. On remount (Strict Mode or auth re-hydration), `previousCountRef` was non-null while `seenIdsRef` was empty, so historical inbox items were treated as new events.
2. **No toast-level deduplication:** `uiStore.addToast` always appended a new toast even when title/body matched a recent notification.
3. **Ephemeral seen-ID tracking:** `seenIdsRef` lived only in component memory and reset on remount.

## Fix

| Layer | Change |
|---|---|
| `NotificationSoundBridge` | Baseline-first inbox seeding; sessionStorage-backed seen IDs per user |
| `uiStore.addToast` | Optional `dedupeKey` suppresses duplicate active toasts |
| `useOfflineQueueToasts` | Dedupe key on “Back online” toast |
| Tests | `notification-toast-tracker.test.ts`, `uiStore` dedupe test |

## Verification

- Unit tests pass for tracker persistence and toast dedupe.
- Manual scenarios to verify in browser: login, refresh, tab focus, multiple tabs.

## Files

- `apps/frontend/src/components/notifications/NotificationSoundBridge.tsx`
- `apps/frontend/src/state/uiStore.ts`
- `apps/frontend/src/utils/notification-toast-tracker.ts`
- `apps/frontend/src/hooks/useOfflineQueueToasts.ts`
