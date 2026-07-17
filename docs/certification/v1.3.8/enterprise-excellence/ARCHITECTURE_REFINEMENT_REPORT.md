# Architecture Refinement Report

**Date:** 17 July 2026

## Current shape

Modular Express monolith + Next.js BFF. Bounded contexts exist as `modules/*` but mega-services (`settings` ~1.4k LOC) still couple concerns.

## Refinements this sprint

- Dashboard read path separated: overview uses SQL aggregates; summary no longer double-loads payments for KPIs.
- Payment immutability clarified at API + client boundary (no silent PATCH theatre).

## Recommended next modularizations (v1.4)

| Module | Split into | Why |
|---|---|---|
| `settings/service.ts` | users / invitations / roles / system-settings | Cohesion |
| `communications/service.ts` | compose / delivery / audience | Testability |
| Dashboard | keep command/query split; add materialized KPI table | Scale |

## Patterns to prefer

- Modular monolith (confirmed) — no microservices yet
- Outbox + workers before network service extraction
- CQRS for reports only

## Coupling risks remaining

- Direct `void notify*` from money services
- Frontend client pagination over full lists
- Shared DB without context-owned schemas
