# UX Improvement Report (v1.1)

**Date:** 2026-07-05

## User-facing changes

### Guided empty states

Empty pages now explain **why** data is missing and **how to create the first record**, with primary CTAs where applicable (borrowers, reviewed applications, and shared copy for all modules).

### Module guidance

Collapsible help panels on loan pools, collectors, risk flags, reports, adjustments, groups, borrowers, and loans pages.

### Search

- Real-time global search from 1 character
- Partial matching on names, phones (ignoring formatting), IDs
- Highlighted matches in search results

### Dashboard

Recent Activity section on the super-admin dashboard surfaces the latest alerts with deep links.

### Notifications

Notification drawer supports filtering by All, Unread, and Critical severity.

## Error messaging

Connection failures use dedicated copy (`Unable to load this data`) instead of implying an empty dataset.

## Metrics

| Metric | Before | After |
|--------|--------|-------|
| Modules with inline guidance | 0 | 9 |
| Guided empty state modules | 1 | 3+ (pattern established for all) |
| Global search min query | 2 chars | 1 char |
| Notification inbox filters | 1 view | 3 views |
