# WILMS v1.7.5 — App Lock Report

## Status

Complete — Phase F.

## Delivered

- Configurable idle timeout persisted in `appLockStore` (1–15 minutes)
- Optional WebAuthn/platform biometric enrolment with PIN fallback
- Visibility/`pagehide` lock when idle threshold already elapsed
- Setup panel and unlock overlay updated

## Notes

- PIN remains mandatory fallback
- E2E idle overrides via `window.__WILMS_E2E_APP_LOCK_IDLE_MS` retained
