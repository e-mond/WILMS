# GitHub Release Draft — WILMS v1.3.5

> **Status:** Prepared — do not publish until post-deploy verification completes.

**Release title:** `WILMS v1.3.5`

**Tag:** `v1.3.5`

---

## Release Summary

UI/UX and communication platform release: premium startup splash, unified email design system, notification center refresh, and preference-aware dispatch.

### Added
- Premium animated startup splash with reduced-motion support
- Email catalogue and new security/announcement templates
- Notification center search, filters, pagination, delete, mark-all-read
- Login-alert dispatch on successful sign-in

### Changed
- Login page copy and hierarchy (tagline moved to emails only)
- Route transition top progress bar loader
- Transactional email respects user notification preferences

### Database
- Migration `0022_v135_notification_events.sql`

### Dependencies
- `framer-motion@11.11.17` (frontend)

---

## Deploy Steps

```bash
npm install
npm run db:migrate -w @wilms/api
npm run build
```

---

## Verification Checklist

- [ ] `/health` returns version `1.3.5`
- [ ] Login footer shows `WILMS v1.3.5`
- [ ] Startup splash completes without flash
- [ ] Password reset sends password-changed notification
- [ ] Login sends login-alert when email/in-app enabled

---

## Full Notes

See `RELEASE_NOTES_v1.3.5.md` and `CHANGELOG.md` [1.3.5].
