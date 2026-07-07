# WILMS - Project Status

**Last updated:** 2026-07-07 (v1.1.2 hotfix ready)  
**Package version:** `1.1.2`  
**Branch:** `hotfix/v1.1.2-user-management-notifications`  
**Production (Railway API):** `v1.1.1` — v1.1.2 deploy pending  
**Production (Vercel UI):** `v1.1.1` on login page

---

## Summary

v1.1.2 hotfix addresses notification delivery (email/SMS), user invitation reliability, registration officer access, address field stability, and Type of Work "Other" input. All local verification passes. Production deploy pending after PR merge.

---

## v1.1.2 hotfix scope

| Phase | Status |
|-------|--------|
| Email & SMS delivery + logging | ✅ Complete |
| Registration Officer My Registrations view | ✅ Complete |
| Registration form (address, Type of Work) | ✅ Complete |
| User notifications (email/SMS wiring) | ✅ Core events wired |
| Delivery logging (`message_deliveries`) | ✅ Complete |
| Tests & smoke | ✅ All pass locally |
| Documentation & reports | ✅ Complete |

See [V1.1.2_NOTIFICATION_REPORT.md](./V1.1.2_NOTIFICATION_REPORT.md) for full details.

---

## Verification status

| Check | Result |
|-------|--------|
| `npm run type-check` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |
| `npm run test -w @wilms/api` | **53/53** |
| `npm run test -w @wilms/frontend` | **223/223** |
| `smoke:production` (live v1.1.1) | **31/31** |
| `smoke:rbac` (live) | **11/11** |

---

## Production configuration (v1.1.2)

**Railway (API):**
- `WILMS_VERCEL_MAIL_URL=https://wilms.vercel.app`
- `WILMS_INTERNAL_MAIL_SECRET=<shared-secret>`
- `WILMS_APP_URL=https://wilms.vercel.app`

**Vercel (frontend):**
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_FROM`
- `WILMS_INTERNAL_MAIL_SECRET=<same-shared-secret>`

---

## After v1.1.2 deploy

1. Confirm migrations **15/15** on `/health`
2. Send test email from Settings
3. Create test user — verify invitation email delivered
4. Officer login → My Registrations → View borrower detail
5. Check `GET /settings/delivery-logs` for delivery audit trail

---

## Ready for v1.2

v1.1.2 closes notification and registration gaps. Remaining enhancements (invite tokens, password reset emails, payment reminder scheduler, full in-app inbox) tracked for v1.2.
