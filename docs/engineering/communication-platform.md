# Communication Platform

**Version:** v1.3.5  
**Last updated:** 2026-07-11

## Overview

WILMS uses a centralized communication service for transactional email, SMS, push, and in-app notifications. Business events dispatch through `event-dispatch.ts`; templates live in `templates.ts` and share the `email-layout.ts` design system.

## Email Design System

All transactional emails use `buildEmailTemplate()` with:

- Branded header and logo
- Mission tagline (emails only): *Helping women grow through interest-free financing.*
- Status banners (`emailStatusBanner`)
- Primary and secondary CTAs
- Responsive table-based HTML
- Plain-text fallback
- Privacy and contact footer

Reusable template variables: `{{firstName}}`, `{{loanNumber}}`, `{{amount}}`, `{{collector}}`, `{{groupName}}`, `{{dueDate}}`, and others documented in `email-catalogue.ts`.

## Template Catalogue

`apps/backend/src/infrastructure/notifications/email-catalogue.ts` lists every template by category (authentication, registration, loans, payments, groups, administration) with supported channels.

## Notification Preferences

Users configure channels and categories in Settings → Notification Preferences. The backend `shouldSendChannel()` function in `preferences.service.ts` gates dispatch when a `userId` is provided.

Supported preferences:

- Email, SMS, Push, In-app (channel toggles)
- Marketing, Announcements, Reminders (category toggles)
- Loan, Payment, Approval, Registration notification categories
- Digest frequency: Instant, Daily, Weekly

## In-App Notification Center

The notification inbox panel supports search, category filters (payments, loans, security), read/unread, mark-all-read, delete (archive), pagination, and relative timestamps.

## Future Channels

The dispatch architecture supports adding SMS, push, WhatsApp, Slack, and Microsoft Teams without template duplication — each channel plugs into `event-dispatch.ts` alongside existing email and in-app handlers.

## Database

Migration `0022_v135_notification_events.sql` adds `PASSWORD_CHANGED`, `INVITATION_ACCEPTED`, and `LOGIN_ALERT` to the `notification_event` enum.
