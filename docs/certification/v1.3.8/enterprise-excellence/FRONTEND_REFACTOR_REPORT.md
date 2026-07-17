# Frontend Refactor Report

**Date:** 17 July 2026

## Completed

- Deleted dead payment-edit hook + schema
- `paymentService.editPayment` fails closed with `ApiError` CONFLICT
- Tour overlay: pause/resume, analytics, role step cleanup
- Tour route tests extended

## Deferred (safe)

- Remove `editPayment` from `IPaymentService` + mock + unit tests in a dedicated PR
- Convert `usePaginatedRows` call sites to server pages
- Move offline queue from localStorage → IndexedDB

## Bundle / render

No new heavy deps. Tour dialog already uses focus trap + `prefers`-friendly CSS pulse. Recommend virtualized tables before 500+ row admin screens.
