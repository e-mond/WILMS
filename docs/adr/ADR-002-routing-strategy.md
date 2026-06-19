# ADR-002 — Routing Strategy

**Status:** Accepted
**Date:** Phase 2, May 2026

---

## Context

WILMS has four distinct user roles, each with a structurally different UI:

- **Super Admin** — dense desktop admin with navigation across 15+ pages
- **Collector** — minimal mobile-first UI with 4 primary screens; must load fast on 3G
- **Registration Officer** — form-heavy flow with multi-step registration
- **Approver** — queue-based workflow UI

The application uses Next.js 14. We must decide between the **App Router** and **Pages Router**, and define how role-based route protection is enforced.

Additionally, the routing strategy must support:
- Role-specific shell layouts (different navigation per role)
- Fast initial load for the Collector dashboard (< 2 seconds on 3G)
- Clean URL structure that maps to the role-permission model
- Route-level code splitting so the Collector bundle does not include Super Admin code

---

## Decision

Use the **Next.js 14 App Router** with **route groups** for role-based shell separation.

### Route Group Structure

```
app/
├── (auth)/                   ← Login, session-expired (no role shell)
├── (super-admin)/            ← Super Admin shell layout
│   └── layout.tsx            ← Sidebar nav + role check
├── (collector)/              ← Collector shell layout
│   └── layout.tsx            ← Bottom nav + offline banner + mobile layout
├── (registration-officer)/   ← Registration Officer shell layout
│   └── layout.tsx            ← Minimal nav
└── (approver)/               ← Approver shell layout
    └── layout.tsx            ← Queue-focused nav
```

Route groups (parentheses) enable separate layouts per role without affecting the URL structure.

### Role-Based Protection

Role enforcement at **two levels**:

1. **Middleware (`middleware.ts`)** — reads auth session (from httpOnly cookie); redirects unauthenticated users to `/login`; redirects authenticated users who attempt to access wrong-role routes to their correct root
2. **Shell layout (`layout.tsx` per group)** — secondary check; renders `null` and redirects if session role does not match shell role (defence in depth)

This ensures:
- A Collector navigating to `/dashboard` (Super Admin route) is redirected at the middleware level before any page code runs
- No Super Admin data is fetched or rendered for a Collector session

### Code Splitting

Next.js App Router automatically code-splits by route segment. Each role group is a separate bundle entry. The Collector's 4-page bundle is completely separate from the Super Admin's 15+ page bundle, satisfying the 3G performance requirement.

---

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| Pages Router | No nested layouts without complex workarounds; App Router is the Next.js 14 standard and better supports role shell layouts |
| Single layout with role-conditional navigation | One large layout bundle served to all roles; Collector gets Super Admin code; violates performance requirement; harder to maintain |
| Client-side route guards only | Middleware-level protection is necessary; client-only guards can flash wrong content before redirect |
| Separate Next.js apps per role | Operationally complex; shared components require a monorepo; overkill for WILMS's scale |

---

## Trade-offs

| What is gained | What is sacrificed |
|---|---|
| Clean role isolation at route and bundle level | App Router's React Server Components require care around client/server component boundaries |
| < 2 second Collector load (small isolated bundle) | Middleware adds a small latency on every request (< 5ms; acceptable) |
| Defence-in-depth RBAC (middleware + layout) | Two places to update if role structure changes |
| Each shell independently maintainable | More files than a single-layout approach |

---

## Consequences

- New routes for a role must be placed in the correct route group — placing a Collector route in `(super-admin)/` is a critical access control error
- Any shared page (e.g., a borrower profile accessible by both Approver and Super Admin) should be placed in the most privileged group with a redirect rule, not duplicated
- The middleware must be updated any time a new role or route group is added
- Shell layouts must never render restricted navigation items for the wrong role — use `null` return, not CSS `display: none`
