# Email System Report — v1.3.5

**Date:** 2026-07-11  
**Version:** 1.3.5

---

## Architecture

| Component | Path | Role |
|-----------|------|------|
| Layout engine | `email-layout.ts` | Header, footer, banners, CTAs, responsive tables |
| Templates | `templates.ts` | Business-specific builders |
| Catalogue | `email-catalogue.ts` | Coverage audit + channel mapping |
| Dispatch | `event-dispatch.ts` | Central routing, preference gates |
| Delivery log | `delivery-log.ts` | Audit trail |

No duplicated template HTML. All builders call `buildEmailTemplate()`.

---

## Design System Components

| Component | Function |
|-----------|----------|
| Header | Branded WILMS bar with accent colour |
| Greeting | Personalised salutation |
| Status banner | `emailStatusBanner()` — info/success/warning/critical |
| Content | Paragraphs, cards, alerts |
| Primary CTA | `emailButton()` |
| Secondary CTA | `emailSecondaryButton()` |
| Footer | Contact, privacy link, mission tagline |
| Plain text | Auto-generated `text` body on every template |

---

## Template Catalogue Coverage

**Total templates:** 30

| Category | Count | Examples |
|----------|-------|----------|
| Authentication | 12 | welcome, verify-email, password-reset, login-alert |
| Registration | 2 | approved, rejected |
| Loans | 7 | approval, disbursed, reminder, default |
| Payments | 3 | confirmation, reversal, collection-reminder |
| Groups | 3 | created, leader-assigned, collector-assigned |
| Administration | 3 | role-changed, maintenance, announcement |

---

## New in v1.3.5

| Template | Channels | Wired |
|----------|----------|-------|
| `buildVerifyEmailEmail` | EMAIL | Catalogue |
| `buildPasswordChangedEmail` | EMAIL, IN_APP | Password reset flow |
| `buildLoginAlertEmail` | EMAIL, IN_APP | Login + OTP verify |
| `buildInvitationAcceptedEmail` | EMAIL, IN_APP | Accept invitation |
| `buildInvitationExpiredEmail` | EMAIL | Catalogue |
| `buildMaintenanceNoticeEmail` | EMAIL, IN_APP | Catalogue |
| `buildAnnouncementEmail` | EMAIL, SMS, PUSH, IN_APP | Catalogue |

---

## Preference Respect

`dispatchEmailWhenEnabled()` calls `shouldSendChannel(userId, 'EMAIL', category)` when `userId` is set. Login-alert uses channel-only gate (security; no category suppression).

---

## Reusable Variables

Documented in `EMAIL_TEMPLATE_VARIABLES`: `firstName`, `lastName`, `loanNumber`, `amount`, `collector`, `groupName`, `dueDate`, and others.

---

## Tests

| Test file | Result |
|-----------|--------|
| `email-layout.test.ts` | 6/6 PASS |
| `templates.test.ts` | 6/6 PASS |
| `email-catalogue.test.ts` | 3/3 PASS |
| `communication-platform.test.ts` | 5/5 PASS |

---

## Email Client Compatibility

Templates use table-based HTML, inline styles, and MSO conditionals patterns established in `email-layout.ts` for Gmail, Outlook, Apple Mail, and Yahoo compatibility.

**Live client rendering:** Not executed in this agent environment (no mail capture inbox). Structural compliance verified via layout unit tests and established table-based patterns.

---

## Brand Tagline Policy

Mission tagline *Helping women grow through interest-free financing.* appears in email footer only — not on login UI (verified by E2E).
