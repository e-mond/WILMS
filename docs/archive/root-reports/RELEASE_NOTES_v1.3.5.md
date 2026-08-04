# WILMS v1.3.5 — Release Notes

**Version:** 1.3.5  
**Release date:** 2026-07-11  
**Type:** Minor release — UI/UX & Communication Platform

---

## Summary

v1.3.5 delivers a premium startup experience, a unified transactional email design system, an expanded email catalogue, a refreshed notification center, and preference-aware communication dispatch.

---

## Highlights

### UI/UX
- Login page simplified: logo, application name, “Welcome Back”, and “Sign in to continue” — mission tagline removed from login (retained in emails only).
- Premium GPU-accelerated startup splash (Framer Motion) with reduced-motion fallback.
- Route transition loader uses a top progress bar instead of a spinner pill.

### Communication & Email
- Shared email design system: header, status banners, primary/secondary CTAs, responsive layout, privacy footer, plain-text bodies.
- Central email catalogue (`email-catalogue.ts`) documenting 30 templates across authentication, loans, payments, groups, and administration.
- New templates: verify email, password changed, login alert, invitation accepted/expired, maintenance notice, announcement.
- Transactional email dispatch respects user notification preferences when `userId` is provided.

### Notifications
- Notification center: search, category filters (payments, loans, security), pagination, mark-all-read, delete (archive), relative timestamps, avatars.
- Login-alert email and in-app notification on successful sign-in.
- Password-changed and invitation-accepted notifications wired end-to-end.

---

## Migration Notes

1. Run database migration before deploy:

```bash
npm run db:migrate -w @wilms/api
```

2. Migration `0022_v135_notification_events.sql` adds enum values: `PASSWORD_CHANGED`, `INVITATION_ACCEPTED`, `LOGIN_ALERT`.

3. No breaking API contract changes. Frontend reads version from root `package.json` via `NEXT_PUBLIC_APP_VERSION`.

---

## Upgrade Notes

1. `npm install` at repository root (adds `framer-motion` to frontend).
2. Deploy API before or with frontend so `/health` reports `1.3.5`.
3. Verify login page shows `WILMS v1.3.5` in footer after deploy.
4. Re-test notification preferences in Settings after migration.

---

## Performance Improvements

- Bundle gzip total: **168.6 KB** JS (budget 350 KB) — PASS.
- Splash animation uses GPU transforms (`opacity`, `scale`) with `will-change` via Framer Motion.
- Notification inbox pagination limits DOM render to 20 items per page.

---

## Security Improvements

- Login-alert notifications on successful authentication (email + in-app when enabled).
- Password-changed notification after reset.
- Security-category inbox filter surfaces `LOGIN_ALERT`, `PASSWORD_CHANGED`, and invitation events.

---

## UI Improvements

- Consistent auth hierarchy across login, forgot-password, and reset flows.
- Skeleton and progress-based loading patterns extended to bootstrap and route transitions.
- Notification inbox modernized with Lucide icons and filter chips.

---

## Communication Improvements

- Single `event-dispatch.ts` entry point; no duplicated template logic.
- Email mission tagline scoped to email channel only.
- Catalogue supports future SMS, push, WhatsApp, Slack, and Teams channels without rewrites.

---

## Resolved Issues

- Login E2E helpers updated for “Welcome Back” heading (was “Sign in”).
- App bootstrap tests mock reduced-motion for deterministic hydration.
- Missing `0020` journal entry restored in migration metadata.

---

## Known Issues

- Production RBAC smoke: 2/4 checks pass without full smoke credentials (`admin-login`, `officer-blocked-dashboard` require configured secrets).
- Production smoke suite requires `WILMS_APP_URL` and `WILMS_API_URL` — not executed in CI agent environment without secrets.
- Full Playwright accessibility suite (`e2e/accessibility.spec.ts`) not re-run this release cycle; prior WCAG 2.1 AA audit remains baseline — target is WCAG 2.2 AA ongoing.

---

## Verification (2026-07-11)

| Check | Result |
|-------|--------|
| Type check | PASS |
| ESLint | PASS |
| Production build | PASS |
| Backend unit tests | 105/105 PASS |
| Frontend unit tests | 233/233 PASS |
| Login/forgot-password E2E | 18/18 PASS |
| Version consistency | PASS |
| Bundle budget | PASS |
| RBAC production smoke | 2/4 (credentials) |

---

## Git Tag

```
v1.3.5
```

Tag message: `WILMS v1.3.5 — UI/UX & Communication Platform`
