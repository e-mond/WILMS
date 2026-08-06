# Executive Dashboard Report — v1.7.1

## Purpose

Separate **Executive Intelligence** (`/executive`) from the **Operational Dashboard** (`/dashboard`).

| Surface | Audience | Question answered |
| --- | --- | --- |
| Operational Dashboard | Staff operators | What do I need to do today? |
| Executive Intelligence | Directors, MPs, boards, finance committees | How is the organisation performing? |

## Operational Dashboard

- Work queue cards (applications, disbursements, collections, expenses, reconciliation, risk)
- Operational KPI strip
- Quick actions
- Audit-backed recent activity
- Compact collection / expense / reconciliation summaries
- Explicit link to Executive Intelligence

Removed from primary operational focus:

- Deep financial chart studio (board analytics)
- Collector performance density as primary hero content

## Executive Intelligence

- Portfolio / cash / risk / forecast framing
- Community + as-of filters
- Forecast horizon controls
- Explicit link back to Operational Dashboard
- Distinct visual eyebrow (executive packaging)

## Acceptance

- [ ] Super Admin can explain the difference in one sentence
- [ ] No shared hero content that confuses task vs board intent
- [ ] Navigation labels and page titles reinforce the split
