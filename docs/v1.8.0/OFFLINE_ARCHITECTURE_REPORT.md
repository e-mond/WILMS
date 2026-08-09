# WILMS v1.8.0 — Offline Architecture Report

## Model

WILMS uses a layered offline architecture:

1. **Service worker shell cache** (`wilms-v180-shell`) for role visits across admin, collector, officer, approver, and auditor routes.
2. **IndexedDB snapshots** for dashboard and notification read models.
3. **Durable write queue** for field-critical mutations (payments, expenses, holiday requests).
4. **Server sync protocol** (`offline_sync_*`) with approver conflict review for financial operations.

## Write queue coverage

| Operation | Offline write | Sync |
|-----------|---------------|------|
| Record payment | Yes | Background + manual retry |
| Record expense | Yes | Background + manual retry |
| Holiday request create/submit | Yes | Background + manual retry |
| Approvals / recon decisions | Online preferred; conflict merge UI for queued financial ops | Approver sync conflicts |
| Registration / reports / docs | Shell + cached reads | No durable offline write yet |

## Operator UX

- Global offline banner: local data + automatic sync copy
- Sync status panel with pending / failed / review counts and progress
- Connection chip in the navbar

## Residuals

Expanding durable offline writes to every entity remains iterative. Shell navigation and cached reads cover remaining major pages for field continuity.
