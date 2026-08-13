# Final Post-Release Fix Report — Dashboard & Collector Data

**Branch:** `fix/v1.8.0-post-release-dashboard-and-collector-data`  
**Version:** v1.8.0 (no bump)  
**Date:** 13 August 2026

## Summary

Production correctness fixes for collector metrics, sidebar borrower counts, borrowers quick actions, rolling six-month performance, borrower profile group leadership + photo size, collector alerts, and the dashboard reconciliation widget.

## Delivered

1. Real collector borrower counts, trend (↑↓→), streak, expected amounts, rolling 6-month chart, operational alerts  
2. Sidebar Borrowers badge from shared borrowers list query  
3. Borrowers Quick Actions (add / import / assign / reassign / export / pending)  
4. Borrower profile Group Leader / Member + collector label + larger photo  
5. Reconciliation widget metrics + labels + attention count + list performance fix  
6. Automated tests for metrics, quick actions, chart labels, profile badge, recon widget, nav badge  
7. Operations documentation set listed below  

## Documentation

- `documentation/operations/COLLECTOR_METRICS_FIX.md`
- `documentation/operations/BORROWER_DASHBOARD_FIX.md`
- `documentation/operations/RECONCILIATION_WIDGET_FIX.md`
- `documentation/operations/SIDEBAR_COUNT_FIX.md`
- `documentation/operations/DASHBOARD_DATA_CONSISTENCY_AUDIT.md`
- This report

## Remaining issues

- Expense “Needs attention” tile still hard-coded to 0  
- Collector expense submission count still stubbed  
- Deep load testing of collector list under large payment history still recommended in staging  

## Merge recommendation

Merge into `main` after CI green. No version bump. No migration required for these fixes.
