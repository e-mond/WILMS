# Changelog

All notable changes to WILMS are documented in this file.

## [1.2.0] — Communication Platform Completion

### Added
- Rich text composer with formatting, tables, images, emojis, undo/redo, HTML preview, and auto-save drafts.
- Message attachments (PDF, DOCX, XLSX, CSV, PNG, JPG, WEBP) with upload, preview, delete, and replace.
- Complete password reset UI: `/forgot-password`, `/reset-password` with secure token flow.
- Push notification subscriptions, service worker, VAPID endpoints, and user preference gates.
- Email open tracking (pixel) and click tracking (wrapped links) with analytics dashboard.
- Provider webhooks: Resend (signed) and generic mail provider receiver.
- Expanded communication analytics: delivery/bounce rates, time series, top recipients/campaigns.
- Recurring scheduler: daily, weekly, monthly, custom cron, timezone-aware, retry on failure.
- Template builder with `{{variable}}` support, preview, duplicate, and version history.
- User notification preferences (email, SMS, push, in-app, categories, digest frequency).
- Migration `0016_v120_communication_platform.sql`.
- Deliverable reports: `V1.2_COMMUNICATION_PLATFORM_REPORT.md` and related reports.

### Changed
- `dispatchMail()` sanitizes HTML and injects tracking pixel/links.
- Communication Center compose uses rich text editor and attachment uploader.
- `sendMessage()` respects user notification preferences and sends push when enabled.

## [1.1.3] — Communication Center & notification system

### Added
- Professional branded email template engine (`email-layout.ts`) with responsive HTML for all email clients.
- Complete email notification coverage: password reset, welcome, account status, loan rejected/closed/fully paid/default/reminder, payment reversal, collection reminder, group/collector notifications, role changed.
- Communication Center module at `/communication-center` with compose, outbox, templates, delivery reports, and failed messages.
- `communication_templates` and `communication_messages` tables (migration `0015`).
- Multi-channel broadcasts: Email, SMS, and In-App simultaneously.
- Audience targeting: all users, collectors, officers, approvers, admins, specific user.
- In-app notification bridge from domain events to staff inbox.
- Delivery tracking extensions: status, opened_at, clicked_at, bounce_reason.
- Communication analytics API with success/open/click rates.
- RBAC permissions: `MANAGE_COMMUNICATIONS`, `VIEW_COMMUNICATION_ANALYTICS`, `SEND_BROADCAST`.
- Notification API: mark all read, archive/delete.
- Message scheduler for scheduled broadcasts.
- Hotfix reports: `V1.1.3_COMMUNICATION_CENTER_REPORT.md` and related reports.

### Changed
- All email templates redesigned with WILMS branding, CTA buttons, and summary cards.
- `event-dispatch.ts` extended with 20+ notification functions and in-app bridging.
- Domain services (loans, payments, settings, groups) wired to send notifications on all business events.

### Known limitations
- Rich text editor and image attachments in composer (plain text for v1.1.3).
- Push notifications schema-ready but not implemented.
- Open/click tracking requires provider webhook integration.

## [1.1.2] — Messaging, registration & user management hotfix

### Fixed
- User invitation emails not delivered (Railway SMTP blocked; now routed via Vercel Gmail relay).
- Registration Officers could not view their own registered borrower details.
- Home and business address inputs unstable during registration (wizard re-render storm).
- Type of Work "Other" did not show required "Please specify" field or persist custom value.
- Invitation email failures silently swallowed; now surfaced to admin on user creation.

### Added
- `dispatchMail()` with Vercel relay, retries, and persistent delivery logging.
- `message_deliveries` table and migration `0014_v112_notifications.sql`.
- `GET /settings/delivery-logs` — searchable email/SMS delivery history.
- SMS delivery logging with graceful degradation when provider unavailable.
- Domain notification wiring: invitation, registration approve/reject, payment received/missed, loan approved/disbursed, blacklist.
- Officer detail page `/officer/my-registrations/[id]` with RBAC scoping.
- Vercel `/api/mail/send` server-to-server Gmail relay for Railway API.
- Hotfix reports: `V1.1.2_NOTIFICATION_REPORT.md`, `EMAIL_DELIVERY_REPORT.md`, `SMS_DELIVERY_REPORT.md`, `REGISTRATION_FIX_REPORT.md`, `USER_INVITATION_REPORT.md`, `TEST_VERIFICATION_REPORT.md`.

### Known limitations
- Invite flow uses static temporary password (no token/magic link).
- Password reset, welcome, account status, loan rejected/closed, payment reversal emails not yet wired.
- Payment reminder scheduler not implemented.
- In-app inbox not populated for all domain events.

## [1.1.1] ? Production hotfixes

### Fixed
- Registration home/business address inputs ? stable session id and debounced autosave (React #185).
- Navigation highlighting when opening Daily Collection Report under Reports.
- Audit log empty action labels; login/settings events map to correct actions.
- Disbursement readable IDs (`DIS-YYYY-NNNNNN`) stored in database with migration backfill.
- Missing disburse loan action on loan detail (loans stuck `PENDING_DISBURSEMENT`).
- Disbursement portfolio filters replaced with dropdown selects.
- Group member list shows readable borrower IDs from backend.
- Loan pool create modal form fields (labels, focus, submit, validation).
- Switch toggle consistency (size, pill style, keyboard, loading state).

### Added
- Migration `0013_v111_hotfixes.sql` (audit enum values, `loan_disbursements.display_id`).
- `V1.1.1_HOTFIX_REPORT.md`.

## [Unreleased] ? v1.1 user experience

### Added
- `QueryErrorState` for consistent error + retry UX across all feature panels.
- PWA assets (`favicon.ico`, `icon-192.png`, `icon-512.png`) and `npm run generate:pwa-icons`.
- Module guidance on collector, approver, officer, and executive dashboard pages (18 total).
- Guided empty states with why/how guidance and primary CTAs.
- Global search highlighting and improved ID/phone partial matching.
- Super-admin dashboard Recent Activity section.
- Notification inbox filters (All / Unread / Critical).

### Changed
- Migrated all remaining panels from generic connection errors to `GuidedEmptyState` / `QueryStatePanel`.
- Monorepo package version aligned to `1.0.0` (matches tagged production release).
- Collector dashboard: deduplicated KPI grid; expense summary shows errors instead of silent failure.

## [1.0.1] ? Maintenance

### Changed
- Archived historical RC1/v1.0.0 readiness reports into `docs/archive/v1.0.0-rc1.4/`.
- Archived historical phase validation reports into `docs/archive/page-validation/`.
- Redirected generated verification outputs to `docs/generated/`.
- Updated app-lock documentation to reflect optional app lock behavior.

### Fixed
- Removed unused `AppLockRequiredGate` component after confirming it has no imports.

### Reverted
- Non-breaking `npm audit fix` lockfile update reverted after Vitest/Vite type-check regression.

## [1.0.0] ? Production release

- Historical release evidence is preserved under `docs/archive/`.
- RC1.4 closure reports are archived under `docs/archive/v1.0.0-rc1.4/`.
