# Sidebar Count Fix

## Problem

Borrowers sidebar badge showed `0` / was not wired to live data.

## Source of truth

`useNavItemsWithBadges` loads `borrowerService.listBorrowers()` with query key `['borrowers', 'list']` — the same key as the Borrowers page (`useBorrowers`).

Badge value = count of borrowers with status `APPROVED` or `AT_RISK`.

## Refresh behaviour

Any invalidation of `['borrowers']` / `['borrowers', 'list']` refreshes the badge, including after:

- registration approval / rejection
- borrower creation / import
- reassignment flows that invalidate borrower queries

## Shell wiring

`OfficeShell` merges filtered nav items with badges before rendering `DashboardShell` / mobile bottom nav.
