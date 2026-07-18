# Error Handling Review — v1.4.1 (Delta)

**Date:** 2026-07-18  
**Author:** WILMS Engineering

## Improvements

- Global search error state with plain-language copy + retry guidance
- Operations panel already uses friendly `ApiError` messages
- Route segment errors remain via `RouteSegmentError`

## Policy

No SQL, stack traces, Prisma internals, or raw UUIDs as primary user copy.

## Residual

Widget-level isolation sweep on dashboard cards remains P1 follow-up.
