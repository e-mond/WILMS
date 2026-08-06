# Dashboard Activity Audit — v1.7.1

## Prior state

`DashboardRecentActivity` rendered `recentAlerts` from the dashboard summary. Domain `getDashboardSummary()` returned **`recentAlerts: []`**, so production activity was empty unless mock mode injected alerts.

## Authoritative source

| Source | Use |
| --- | --- |
| `GET /audit-log` | Primary timeline |
| Inbox notifications | Separate notification centre (not duplicated here) |
| Communication delivery logs | Available via communication analytics; not duplicated as activity rows |

## Implementation

File: `apps/frontend/src/features/super-admin-dashboard/components/DashboardRecentActivity.tsx`

- Loads audit entries via React Query (`refetchInterval` 60s)
- Deduplicates by entry id
- Classifies into financial / workflow / notification / communication / security / system
- Groups by Today / Yesterday / This week / Earlier
- Role gate: Super Admin, Auditor, Approver
- Entity deep-links where target type is known
- Skeletons, guided empty, friendly error + retry

## Eliminated issues

- Duplicate alert mocks as “activity”
- Stale empty production feed
- Untraceable synthetic messages

## Follow-ups

- Optional merge of high-severity notification events for collectors without audit permission
- Cursor pagination for very large audit histories
