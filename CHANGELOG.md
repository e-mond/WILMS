# Changelog

All notable changes to WILMS are documented in this file.

## [1.3.5] — UI/UX & Communication Platform

### Added
- Premium animated startup splash (Framer Motion) with reduced-motion fallback.
- Email design system enhancements: status banners, secondary CTAs, mission tagline in emails, privacy footer.
- Email catalogue (`email-catalogue.ts`) documenting all transactional templates and channels.
- New email templates: verify email, password changed, login alert, invitation accepted/expired, maintenance, announcement.
- Notification center search, category filters (payments, loans, security), pagination, and delete/archive actions.
- `useDeleteNotification` and `useMarkAllNotificationsRead` hooks.

### Changed
- Login header: logo + application name only; tagline removed from login UI.
- Login form copy: "Welcome Back" / "Sign in to continue".
- Route transition loader uses top progress bar instead of spinner pill.
- Transactional email dispatch respects user notification preferences when `userId` is provided.
- Password reset sends password-changed email and in-app notification.
- Invitation acceptance sends confirmation email and in-app notification.
- Successful login sends login-alert email and in-app notification (when channels enabled).
- Application version bumped to `1.3.5`.

### Database
- Migration `0022_v135_notification_events.sql` adds `PASSWORD_CHANGED`, `INVITATION_ACCEPTED`, and `LOGIN_ALERT` notification events.

### Dependencies
- `framer-motion` added to frontend for GPU-accelerated splash animation.

## [1.3.4] — Production Stabilization

### Fixed
- Mobile photo capture: public `/photo-capture/sessions/*` routes no longer return 401 — `photoCaptureRouter` and `locationsRouter` mount before routers with blanket `requireAuth`.
- Mobile capture upload: BFF exempts token-gated `photo-capture/sessions/*` paths from CSRF (mobile clients have no session cookie).
- Password reset now invalidates existing sessions via `session_version` bump.
- Mobile capture page shows status-specific errors instead of collapsing all failures to "not found or expired".

### Added
- Photo capture public route regression tests (`public-routes.test.ts`).
- Structured logging for capture session create, lookup miss, and completion.
- Production smoke checks for public capture lookup and upload.
- Engineering stabilization audit reports (nine deliverables).
- Deployment and security guide updates for capture troubleshooting.

### Changed
- Application version bumped to `1.3.4`.

## [1.3.3] — Stability & UX

### Fixed
- Service worker no longer reconstructs navigation requests with invalid `mode: navigate`.
- Service worker stops caching runtime scripts/documents; only explicit shell assets are cached.
- OTP verification now records invitation acceptance and first-login milestones.
- Settings user list refreshes after account activation.
- Forgot password API routing: BFF proxied auth to `/api/v1/auth/*` instead of `/auth/*`; added `/api/auth/forgot-password` and `/api/auth/reset-password` Next routes matching login.
- Password reset no longer crashes when `DATABASE_URL` is unset (enumeration-safe success).

### Added
- In-app update prompt with release summary when a new service worker is waiting.
- Audit log skeleton loading state with column layout matching the data table.

### Changed
- Settings section headers use Lucide icons instead of emoji.
- Sign-in page redesigned to enterprise FinTech standards: single brand header, simplified copy, trust strip, caps lock warning, icon password toggle, loading button, and skeleton hydration state.
- Login header refined: logo-only brand mark, application name, and mission tagline (no redundant WILMS heading).
- Forgot password, reset password, and complete profile pages aligned to shared auth shell.
- Forgot password page redesigned with branding, trust indicators, email icon input, success confirmation, resend cooldown, and enumeration-safe messaging.
- Application version bumped to `1.3.3`.

## [1.3.2] — Field Ops Continuation

### Added
- Holiday-aware loan schedule generation that shifts due dates off configured organization holidays.
- Offline expense sync handler and `useRecordExpenseOrQueue` hook for collector expense forms.
- TanStack Query persistence for collector dashboard and borrower read models (24h local cache).
- Expense counts in offline banner, toasts, and dashboard sync status card.

### Changed
- Offline queue sync drains payments and expenses in FIFO order when connectivity returns.
- Application version bumped to `1.3.2`.

## [1.3.1] — Offline Expansion

### Added
- `QUEUED_FOR_REVIEW` offline queue status with collector banner and toast messaging when payments enter approver review.
- Offline upload queue wiring in `PhotoUpload` and `DocumentUpload` when the device is offline.
- Guarantor eligibility scoring fields (`eligibilityScore`, `riskRating`, `scoreFactors`) on API and frontend types.
- Collector dashboard sync status card (connection, sync state, queued payments, pending uploads).
- QR/barcode scanner integration on collector My Borrowers search.
- Organization holidays CRUD API at `/organization-holidays`.
- Offline expense queue item type and `enqueueExpense` store action (sync handler deferred).

### Changed
- Mock offline sync now returns `QUEUED_FOR_REVIEW` to match production financial review flow.
- Application version bumped to `1.3.1`.

## [1.3.0] — Field Operations & Lending Platform

### Added
- Service worker offline shell cache, background sync handler, and collector-first PWA manifest.
- Device health panel with battery and storage monitoring.
- IndexedDB background upload queue with compression in low-data mode.
- Approver offline sync conflict review UI at `/approver/sync-conflicts`.
- QR/barcode scanner component and thermal receipt printing utilities.
- Advanced lending domain: repayment cadences, fees, penalties, guarantor scoring.
- Migration `0020_v130_field_operations.sql` for holidays, fee charges, and penalty rules.
- Grace period enforcement in missed-week marking using `latePaymentGraceDays`.

### Changed
- Offline sync interval and auto-sync now honor collector role settings.
- Background sync pauses during battery saver conditions.
- Application version bumped to `1.3.0`.
- Documentation expanded: offline architecture, sync guide, device management, mobile guide, advanced lending, API overview.

## [1.2.3] — Platform Stabilization

### Fixed
- Invited users who accept and sign in now record `invited_at`, `accepted_at`, and `first_login_at` milestones; Settings shows **Pending setup** until onboarding completes and **Active** after password change.
- Invitation SMS delivery logs failures instead of failing silently; phone numbers are normalized and validated for Ghana mobile format.
- `createObjectURL` memory leaks in photo/document upload previews and premature revocation in DOCX exports.
- Registered user profile modal no longer crashes on missing arrays or unknown borrower statuses.
- Failed communication deliveries display human-readable reasons instead of raw JSON.
- Permanent user deletion also purges `message_deliveries` linked to the user.

### Added
- Migration `0019_v123_platform_stabilization.sql` with invitation lifecycle columns and audit action enum values.
- `POST /auth/accept-invitation` to record invitation acceptance from email links.
- Centralized `normalizeGhanaPhone` / `isValidGhanaMobile` in `infrastructure/sms/normalize-phone.ts`.
- `formatDeliveryFailure()` utility for Communication Center failed-message presentation.
- `useObjectUrl` hook for safe blob preview lifecycle.
- Tests for invitation lifecycle, phone normalization, and delivery failure formatting.

### Changed
- `notifyUserInvitation()` returns per-channel delivery results; `createUser()` awaits delivery and surfaces email/SMS status.
- Audit repository maps `user.invited`, `user.activated`, `user.deleted`, and related actions to correct enum values.
- Application version bumped to `1.2.3` across root, frontend, and API packages.

## [1.2.2] — Security & User Lifecycle Stabilization

### Fixed
- Borrower administration fees now persist in the database instead of an in-memory map that reset on API restart.
- Collectors are never prompted for administration fees on login; fees remain a per-borrower pre-disbursement step only.
- Suspended, disabled, role-changed, and deleted users are logged out on the next API request via session version invalidation.
- User deletion permanently removes invited accounts and anonymizes active accounts with financial history.

### Added
- `users.session_version` for immediate session revocation.
- `borrower_admin_fees` table for durable admin-fee records.
- `session.service.ts`, `purge.service.ts`, and migration `0018_v122_security_user_lifecycle.sql`.
- Tests for admin-fee workflow, session invalidation, and permanent deletion.
- Reports: `V1.2.2_SECURITY_REPORT.md`, `USER_LIFECYCLE_REPORT.md`, `SESSION_INVALIDATION_REPORT.md`, `COLLECTOR_WORKFLOW_REPORT.md`, `TEST_VERIFICATION_REPORT.md`.

### Changed
- Application version bumped to `1.2.2` across root, frontend, and API packages.
- Authentication documentation updated for session invalidation and user lifecycle.

## [1.2.1] — Production Communication & Invitation Stabilization

### Fixed
- User invitation HTTP 500 when email belongs to soft-deleted account (Postgres `23505` unhandled).
- Generic "A server error occurred" masking real backend errors on 5xx responses.
- Delivery logging failures aborting successful email sends in `dispatchMail()`.
- Pending invitation and deleted-account conflicts now return clear 409/422 messages.

### Changed
- `createUser()` writes audit log, checks all email conflict states, passes actor to audit.
- Invitation emails include expiry date and support contact; skip open/click tracking.
- Shared `mapServiceError()` and `mapDatabaseError()` for consistent API errors.
- Frontend displays backend error messages for 409/5xx when available.

### Added
- `findAnyUserByEmail()` repository helper.
- `apps/backend/src/tests/settings/invitation.test.ts`.
- Stabilization reports: `V1.2.1_INVITATION_FIX_REPORT.md`, `INVITATION_ROOT_CAUSE_ANALYSIS.md`, and related verification reports.

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
