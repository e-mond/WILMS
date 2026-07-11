# WILMS - Project Status

**Last updated:** 2026-07-11 (v1.3.5 ready)  
**Package version:** `1.3.5`  
**Branch:** `cursor/v135-ui-communication-release-8847`  
**Production:** v1.3.4 deployed — v1.3.5 pending

---

## Summary

v1.3.5 is a UI/UX and communication platform release: premium startup splash, unified email design system, expanded transactional email catalogue, notification center refresh, and preference-aware dispatch.

---

## v1.3.5 scope

| Item | Status |
|------|--------|
| Login tagline removed (emails only) | ✅ |
| Premium animated startup splash | ✅ |
| Email design system (header, banners, CTAs, footer) | ✅ |
| Email catalogue + new security templates | ✅ |
| Notification center search, filters, pagination, delete | ✅ |
| Notification preferences (email/SMS/push/in-app/digest) | ✅ |
| Login-alert dispatch on successful sign-in | ✅ |
| Route transition progress loader | ✅ |
| Version bump to 1.3.5 | ✅ |

---

## v1.3.4 scope

| Item | Status |
|------|--------|
| Mobile photo capture public route 401 fix | ✅ |
| BFF CSRF exempt for capture sessions | ✅ |
| Password reset session invalidation | ✅ |
| Capture status-specific error UX | ✅ |

---

## Deploy checklist

Migrations through `0022_v135_notification_events.sql` are required.

```bash
npm run db:migrate -w @wilms/api
```

---

## Next candidates

- Admin UI for organization holidays management
- Bluetooth thermal receipt printing integration
- Offline registration draft sync expansion
- Digest scheduler for daily/weekly notification summaries
