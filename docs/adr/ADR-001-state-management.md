# ADR-001 — State Management Strategy

**Status:** Accepted
**Date:** Phase 2, May 2026

---

## Context

WILMS has two fundamentally different state categories:

1. **Server state** — borrower profiles, loan schedules, transactions, reports. This data lives on the server, changes over time, and must be kept fresh across multiple clients (Collectors in the field, Admin in the office).

2. **Client state** — authentication session, current user role, offline payment queue, UI state (open modals, active tabs, toast notifications).

Additionally, Collectors operate in the field on intermittent 3G. The offline payment queue is a critical client-side state that must survive navigation, background tabs, and brief connectivity loss. It must drain reliably on reconnection and cannot be managed by a server-state library alone.

The system also has strict financial integrity requirements: balances must be derived from server-side transaction records, never stored as mutable client state.

---

## Decision

Use **two complementary libraries** with clearly defined ownership:

| Library | Owns | Reason |
|---|---|---|
| **TanStack Query** | All server-derived data (borrowers, loans, schedules, transactions, reports, collector performance) | Caching, background refetch, stale-while-revalidate, optimistic updates, offline mutation queuing via `networkMode: 'offlineFirst'` |
| **Zustand** | Auth session + role, offline payment queue, UI state (modals, toasts, drawers) | Zero boilerplate; small bundle; easy offline queue management; survives route changes |

---

## State Ownership Map

| Store | Zustand Store | Data Managed |
|---|---|---|
| `authStore` | ✅ | User ID, role, session token reference, session expiry flag |
| `offlineQueueStore` | ✅ | Array of pending payment actions; sync status per item |
| `uiStore` | ✅ | Toast queue, open modal ID, active drawer |
| `themeStore` | ✅ | Light/dark mode preference (localStorage persist) |
| `appLockStore` | ✅ | Device PIN hash, enabled flag, lock state, failed attempts (PIN hash persisted; lock state ephemeral) |
| `loginPreferencesStore` | ✅ | Remember-email preference (localStorage persist) |
| Borrower data | TanStack Query | Fetched via `/borrowers`, cached per ID |
| Loan / schedule data | TanStack Query | Fetched via `/loans/[id]/schedule` |
| Transaction / ledger data | TanStack Query | Fetched via `/transactions` |
| Collector performance | TanStack Query | Fetched via `/collectors/[id]/performance` |
| Dashboard summaries | TanStack Query | Fetched via `/dashboard/summary` |

---

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| Redux Toolkit | Excessive boilerplate for WILMS's scope; larger bundle; overkill given Zustand's capability |
| Context API for global state | Re-render propagation issues for Collector dashboard under poor connectivity; not suitable for offline queue complexity |
| TanStack Query alone | Cannot manage offline queue persistence across navigation without complex workarounds; not designed for client-only state |
| Zustand alone | Would require reimplementing caching, background refetch, and stale-while-revalidate — reinventing TanStack Query |
| Jotai | Atomic model suits simple UI state but adds complexity for the offline queue's ordered mutation management |

---

## Trade-offs

| What is gained | What is sacrificed |
|---|---|
| Clean separation between server state and client state | Two mental models to understand (TanStack Query + Zustand) |
| Offline queue managed explicitly and transparently | Slightly more boilerplate than a single-library solution |
| Server data always fresh via background refetch | TanStack Query cache can grow if not configured with appropriate `staleTime` and `gcTime` |
| Financial data always derived from server (no stale balance) | All financial displays require a server round-trip (mitigated by caching) |

---

## Consequences

- All components that display financial data (balances, schedules, summaries) must use TanStack Query hooks — never local state derived from calculations
- The `offlineQueueStore` must be the single source of truth for pending Collector payments when offline
- The `authStore` must be read by the App Router middleware to enforce role-based redirects at the route level
- Any new global state requirement must be assessed: is it server-derived (→ TanStack Query) or purely client-side (→ Zustand)?
- If `offlineQueueStore` grows beyond ~100 items without draining, a warning must be shown to the Collector
