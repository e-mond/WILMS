# App Lock

WILMS uses a device-local PIN to protect field sessions after idle or background time.

## First login

- New users see the mandatory setup gate (`AppLockRequiredGate`) inside the authenticated shell.
- PIN is hashed with the user id and stored in localStorage (`wilms-app-lock`).
- Setup runs once per user+device; returning users with a configured PIN skip setup.

## Normal login

- Username/password login does not prompt for the app lock PIN.
- Users go straight to their portal after authentication.

## When the PIN is required

- After the idle threshold (default 9 minutes, overridable via `NEXT_PUBLIC_APP_LOCK_IDLE_MS`).
- When the tab goes to the background and idle threshold was already met.
- After manual lock from Security settings.
- After refresh while locked (overlay persists until PIN entry).

## Grace period

- 60 seconds after sign-in or successful unlock before idle lock can trigger.

## Security notes

- PIN is never stored in plaintext.
- Wrong PIN attempts are counted locally (max 5).
- Switching to a different WILMS user on the same device clears the stored PIN.
