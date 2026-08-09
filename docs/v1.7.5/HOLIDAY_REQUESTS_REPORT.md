# WILMS v1.7.5 — Holiday Requests Report

## Status

Complete — Phase A.

## Delivered

- Migration `0036_v175_holiday_requests.sql` + Drizzle schema
- Domain module: draft/update/submit/approve/reject/apply with SoD on approve/reject
- Approve auto-applies organisation holiday (multi-day expands calendar rows)
- In-app notifications to supervisors on submit and requester on decision/apply
- Collector UI: `/collector/holidays` (form, calendar, my requests)
- Approver UI: `/approver/holidays`; Settings holidays section review queue
- Quick actions on Super Admin and Collector dashboards
- Domain tests: lifecycle + SoD

## Non-goals (unchanged)

- Replacing admin CRUD for organisation holidays
- Weakening existing SoD on loans/expenses
