# Changelog

All notable changes to WILMS are documented in this file.

## [1.4.1] — UX Shell Hardening + Phase 26 Closure

**Release date:** July 2026

### Summary

Shell, navigation, search, and permission-catalog hardening on top of v1.4.0, plus Phase 26 closure remediations for invitation expiry, adjustment/loan SoD, upload magic bytes, password policy, LOAN_CREATE idempotency, and payment-by-id lookup. Verdict **READY WITH CONDITIONS**; Production Certified **not** issued.

### Fixed
- `/ops` missing from route permission matrix redirected Super Admins to `/dashboard` (nav collision)
- Help FAB overlapping connectivity/health chip (shared `FloatingActionStack`)
- Permission Catalog broken wrapping for technical keys
- Shell page title test expected obsolete “Super Admin Dashboard” label (CI unblock)
- Navbar overflow when sidebar expanded; search keyboard ↑/↓/Enter on the input
- Officer/Approver settings shell no longer shows unused app aside
- Collector product tour no longer targets removed Messages inbox
- Permission overrides UI no longer offers invalid Grant/Revoke combinations (422); surfaces API validation text; profiles expose role permission ids
- Production demo login/seed blocked (`@wilms.demo`); `/auth/session` enforces active session; API 500s no longer leak raw errors
- Collector payment GET / admin-fee status object scoping (assignment required)
- Money reports fail closed when source lists would silently truncate past 2000 rows
- Frontend security headers (CSP, frame deny, nosniff); deploy workflows on Node 22
- Invitation expiry enforced from `invitedAt + 7 days` on login and accept-invitation; resend refreshes `invitedAt`
- Adjustment maker-checker: requester cannot approve own adjustment; pool aggregates refreshed on approve
- Loan create/approve SoD: creator cannot approve own loan
- Upload magic-byte MIME verification (JPEG/PNG/WEBP/PDF)
- Password policy: minimum 10 characters with letter + number (onboarding/reset + frontend)
- `LOAN_CREATE` wrapped in `runWithIdempotency`
- `getPaymentById` uses `findPaymentById` (no 2000-row list scan)

### Documentation
- Final full-system audit pack under `docs/certification/v1.4/final-system-audit/` — verdict **READY WITH CONDITIONS** (Production Certified **not** issued)
- Phase 26 certification pack under `docs/certification/v1.4/phase-26/` — verdict **READY WITH CONDITIONS** (Production Certified **NOT ISSUED**)
- `docs/FINAL_AUDIT_INDEX.md` and `PROJECT_STATUS.md` updated for Phase 26 closure

### Changed
- Sticky header in content column; full-height sticky sidebar
- Nav group label `Daily Operations` (workflow) vs System nav item `Operations` (`/ops`)
- Distinct breadcrumbs/titles for Dashboard vs Operations
- Global search command palette: keyboard navigation, navigation destinations, error/empty states
- Permission Catalog searchable category rows with copyable keys and “Used by” roles
- Product tour includes Operations as a distinct Super Admin step
- Help menu: role guide, shortcuts, my settings, restart tour (distinct panes)
- Collector Messages removed from navigation (route redirects to collector dashboard)

### Documentation (UX / status)
- README / docs hub / PROJECT_STATUS stamped to **1.4.1**
- UX audit pack expanded (`UX_SHELL_AUDIT.md`, `NAVIGATION_AUDIT.md`, …)
- `ROLES_AND_PERMISSIONS_GUIDE.md` — role defaults vs per-user overrides

## [1.4.0] — Platform Foundation (Phase 25)

**Release date:** July 2026

### Summary

v1.4 platform foundation: Node 22 standardization, optional Redis/BullMQ durable jobs with in-process fallback, mandatory idempotency controls (production default), cursor pagination helpers + borrowers keyset API, transactional outbox table, feature flags, extended ops/Prometheus queue metrics, and backup/restore drill script.

### Added
- BullMQ + ioredis optional queue layer (`REDIS_URL`); graceful in-process fallback
- Feature flags (`WILMS_FLAG_*`) for queues, idempotency, cursor pagination, outbox, tracing, GL dual-write stub
- Transactional `domain_outbox` table (migration `0028_v140_platform_foundation`)
- Cursor/keyset pagination helpers; borrowers list supports `pagination=cursor`
- OpenTelemetry-compatible span logging (structured JSON; no collector required)
- Queue gauges on `/ops/metrics`; ops status reports queue mode + feature flags
- `npm run verify:node` and `npm run drill:backup-restore`
- CI gates: Node 22 check, migration journal, version consistency

### Changed
- Package version **1.4.0**; engines `node >= 22`; Dockerfile `node:22`
- Idempotency: request payload hash conflict detection; production requires `Idempotency-Key` when flag enabled
- Health/ops worker topology reflects Redis configuration

### Not in this release
- Statutory double-entry GL (v1.5)
- Full OpenTelemetry collector export
- Authenticated production smoke / Neon restore evidence (operator-gated)

## [1.3.8] — Final Hardening

**Release date:** July 2026

### Summary

Production-quality hardening: toast deduplication, skeleton loading, mandatory guided tour, user permission overrides, friendly error boundaries, and security IDOR/webhook/upload fixes.

### Fixed
- Product tour Expenses step linked to removed `/settings/expenses` (404); tour routes corrected per role.
- Loan pool utilisation stayed at 0% after create + disburse when groups were not linked to a pool.
- Login chime blocked by browser autoplay after async auth; notification sounds now cover all inbox events.
- Reconciliation status labeled “Under review”; now shows **Pending** until Super Admin approves/rejects flagged variance.
- Collector expense history 403 (list required manage permission); recorders can view their history; expenses need no approval.
- Outbound email leaked `@media` CSS as visible body text; responsive shell preserved and fluid on small screens.
- Collectors were not notified when assigned borrowers’ loans were disbursed.
- Role clone unique-name conflicts (422) and delete confirmation UX.
- Messaging thread adminId IDOR; registration delete officerId IDOR; approver reviewed-list IDOR.
- Notification outbound send without permission gate.
- Upload size enforced on decoded buffer length.
- Unauthenticated generic mail webhook; Resend webhook fail-open when secret missing.
- Gmail SMTP test route trusted unsigned session cookies.
- Payment reversal/edit actor spoofing; collector payment collectorId attribution.

### Changed
- Guided tour UI: progress bar, step dots, nav highlights, keyboard tips, corrected deep-links.
- Loan create requires a funding pool when pools exist; pool create/aside can assign groups.
- Disburse invalidates loan-pool queries so utilisation refreshes immediately.

### Added
- Mandatory product tour welcome flow and Help FAB.
- User-level permission override API and settings UI.
- Route-level error boundaries for key Super Admin modules.
- Skeleton loading system for pages and panels.
- Super Admin Operations dashboard (`/ops`) with `GET /ops/status` and Prometheus `GET /ops/metrics`.
- Request correlation via `X-Request-Id` (BFF → API → structured logs).
- Production operations certification pack and product acceptance pack under `docs/certification/v1.3.8/`.
- Go-live closure pack (`docs/certification/v1.3.8/go-live/`) with production health evidence and operator closure checklist.
- Production cutover pack (`docs/certification/v1.3.8/production-cutover/`) — public deploy evidence captured; certificate held until operator gates close.

### Security
- See `FINAL_SECURITY_AUDIT.md` for full certification findings.

## [1.3.7] — Stable Release

**Release date:** July 2026

### Summary

Stable production release consolidating rc1–rc3: financial integrity, human-readable IDs, reconciliation lifecycle, collector workflows, notifications, and executive dashboard polish.

### Fixed
- **Display IDs:** Remaining UUID leaks in group collector profile, financial ledger report, CSV exports (groups, pools, collectors), and disbursement toasts.
- **Groups table:** Responsive columns with truncation and tooltips; no clipped group names.
- **Registration:** Character counters on full name and nationality fields.
- **Dashboard preferences:** Cards/charts toggle persists in `localStorage` per user across refresh and re-login.

### Added
- **Reconciliation dashboard summary:** Super Admin financial overview shows awaiting review, approved today, rejected, and total submitted.
- **Product tour replay:** Quick action on executive dashboard; existing replay from Settings → Profile.
- **Financial calculations doc:** `docs/financial-calculations.md` — single source of truth for pool and dashboard formulas.

### Changed
- Application version set to **1.3.7** (stable).

### Deployment
- Apply migrations `0024` and `0025` before production promote.
- Verify `/health` → `schema.status: ok`.
- Production certification remediation: journal through `0026`, schema repair migration, `verify:migrations`, health integrations audit (2026-07-13 — **not certified** on live).

---

## [1.3.7-rc3] — RC3 Blocking Fixes

### Fixed
- **Financial KPI zeros (production):** Loans now link to loan pools via borrower group membership at creation/disbursement; pool allocations refresh on disbursement; migration backfills `loan_pool_id` on existing loans.
- **Loan pool KPI zeros:** Migration `0025` backfills historical `DISBURSEMENT`/`REPAYMENT` allocations; active pool count includes funded pools; summary merges portfolio totals; **Total Collected** KPI added.
- **Financial model:** Available balance = pool capital − outstanding; net collections after expenses; expenses deducted from operating cash.
- **Dashboard charts:** Labels truncate and currency values stay on one line inside chart cards.
- **Disbursement toolbar:** Cycle/Status filters separated from Export/Create Loan actions.
- **Reconciliation false positives:** Balanced submissions auto-approve; no review when zero collections expected; review queue excludes approved items.
- **Collections variance:** Daily collection summary always recomputes `collected − expected`; aside panel shows expected, collected, and signed variance with contextual notes.
- **Collector dashboard:** Expected collections filtered by payment day (matches daily collection report).
- **Expense recorded-by:** Super Admin expense list resolves collector display names from user records (not generic "Collector").
- **Display ID leaks:** Payment log, collector group cards, and collection sheet use human-readable IDs.
- **Reconciliation preview:** Unsubmitted variance reflects system recorded vs expected (not hardcoded zero).

### Changed
- **Financial overview:** Cards/charts toggle and chart type persist for the browser session; net collections after expenses and net operating cash KPIs.
- **Collections aside:** Reconciliation status summary for the selected report date (submitted, approved, under review).
- **Reconciliation lifecycle:** Expanded status labels (Draft, Submitted, Under review, Returned, Approved, Rejected, Locked, Archived) with richer submitted-state messaging.
- **Registration:** Character counters on business name and type-of-work fields.
- **Product tour:** Role-specific walkthrough with route navigation, element highlights, dismiss, and replay from Settings → Profile.
- Application version bumped to `1.3.7-rc3`.

---

## [1.3.7-rc2] — UI, Financial Dashboard, Notifications & Workflow

### Fixed
- **Financial KPI zeros:** Dashboard aggregates now reconcile loan portfolio totals with pool allocations; pool aggregates refresh on disbursement and repayment.
- **Collector variance:** Expected collections derived from active portfolio loans; variance displays signed `+/-` amounts with colour coding.
- **Collections reconciliation:** Variance KPI uses `VarianceAmount` instead of accounting parentheses.
- **Display IDs:** Year-based `POOL-YYYY-###`, `GRP-YYYY-###`, `EXP-YYYY-###`; loans no longer fall back to raw UUIDs in UI.
- **Disbursement layout:** Toolbar actions stack on small screens; loan table uses nowrap identifiers and amounts.
- **Stale bundle:** Automatic chunk recovery reload on deploy mismatch (`ChunkRecoveryHandler`).
- **Collector messaging:** In-app and push notifications delivered to message recipients.

### Changed
- **Financial overview:** Cards / Charts toggle with bar, line, area, and pie chart modes (summary cards remain default).
- **Loan rules:** Duration options expanded to 4–52 weeks (4, 8, 10, 12, 16, 20, 24, 26, 36, 52).
- **Expense workflow:** Expenses auto-record as approved — no approval gate; admin view is audit/read-only.
- **Collector expenses:** History panel with search, filter, and export on `/collector/expenses`.
- **Audit log:** Grouped sections (Today, Yesterday, This Week, etc.) with expand/collapse, search, and pagination.
- **Reconciliation lifecycle:** Status tracking (`PENDING_REVIEW`, `UNDER_INVESTIGATION`, `APPROVED`, `REJECTED`, `REOPENED`) with review metadata; Super Admin notified on submit.
- **Notification sounds:** Optional message, security, and loan decision tones (respects reduced motion).
- Application version bumped to `1.3.7-rc2`.

---

## [1.3.7-rc1] — Stability, UX & Business Logic (Release Candidate)

### Fixed
- **Admin fee 403:** `GET /borrowers/:id/admin-fee-status` now uses `RECORD_COLLECTIONS` permission instead of borrower group-assignment checks that conflicted with the admin-fee queue.
- **Remember Me:** Login form no longer clears email/password when toggling “Remember email” or typing while the preference is enabled.
- **Reviewed applications table:** Backend returns correct DTO (`borrowerId`, `borrowerName`, `reviewedBy`); table columns and layout improved.
- **Registration validation:** User-friendly messages for gender, ID type, and date of birth (no raw Zod enum errors).
- **Date of birth:** Maximum date enforces 20+ age; future dates blocked.
- **Display IDs:** Collector performance, loan pool aside, and group aside now show human-readable IDs (`COL-###`, pool/group codes).
- **Create loan:** Submit validation failures now surface errors and return to the relevant wizard step; disbursement unlock adds a Create loan action.
- **Registration PDF:** Table-based print layout for readable field alignment in exports.
- **E2E flakes:** Mobile context panel drawer, auditor reports breadcrumb, toast bridge, connection status chip tests.

### Changed
- **Super Admin dashboard:** Production `/dashboard/summary` KPIs aligned to spec (`pool`, `disbursed`, `collected`, `outstanding`) with backend `financialOverview` aggregates (capital, lending, collections, admin fees, expenses, cash flow).
- **Financial overview:** Analytics view toggle with chart summaries (default remains detailed summary panels).
- **Registration wizard:** Visual step progress bar (`Step N of M`) with accessible progress indicator; compact address fields with character counts and GPS accuracy checks.
- **Approver navigation:** Distinct icons for Pending Queue (clock) vs Offline Sync (cloud-off).
- **Financial RBAC audit:** Regression test suite for money-moving endpoint permissions.
- **VERSION.md:** Canonical version reference for v1.3.7-rc1.
- Application version bumped to `1.3.7-rc1`.

---

## [1.3.6-rc1] — Production Stabilisation (Release Candidate)

### Fixed
- Collector Settings: removed duplicate PIN section; App Lock is the single device PIN entry point.
- Legacy `/collector/security` redirects to Settings (App Lock).
- Admin Collectors messaging: relaxed thread `collectorId` validation so demo and production user ids work.
- Collectors aside panel: show formatted collector display id instead of raw internal user id.
- Health endpoint: added `degradedReasons` array for migration/schema/upload diagnostics.
- Production builds: webpack never resolves mock services when `NODE_ENV=production`.

### Operations
- Production health `degraded` root cause documented: pending migrations `0020_v130_field_operations` and `0022_v135_notification_events` (verified via live `/health` probe).

### Changed
- Application version bumped to `1.3.6`.

### Fixed (post-merge)
- Login OTP emails now use the branded WILMS HTML template (logo, header, OTP code block).
- Email layout: logo image in header, fixed 600px desktop width with responsive fallback.
- Splash screen: logo stays centered; smaller `WILMS` wordmark anchored at bottom.
- Super admin dashboard: full-width KPI grid and relaxed section spacing (less cramped layout).

---

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
