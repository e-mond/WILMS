# RC1.4 ÔÇö Settings Completion

**Status:** VERIFIED

## Super Admin (`/settings`)

All 11 sections functional per PG-07 audit. User invite, role CRUD, expenses, audit log, and system settings persist via `PATCH /settings`.

## Role settings panels

Decorative disabled controls removed from overflow where non-functional. App Lock remains fully wired via `AppLockSetupPanel`.

## Orphan cleanup

`DATA_EXPORTS` section removed from nav (was unimplemented).

## User actions

| Action | Status |
|--------|--------|
| Invite user | Wired ÔÇö settings service sends invite email |
| Edit user | Wired |
| Role assignment | Wired |
| Reset password (modal) | Removed until IdP integration (no placeholder) |
| Force logout (modal) | Removed until backend endpoint (no placeholder) |
