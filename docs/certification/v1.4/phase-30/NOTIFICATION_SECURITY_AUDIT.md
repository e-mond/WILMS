# Notification Security Audit

**Version:** 1.4.2 | **Phase:** 30

## Authorization

| Control | Status |
|---------|--------|
| Inbox scoped to session userId | ✓ existing |
| Mark read/archive requires ownership | ✓ existing |
| Scheduler requires `MANAGE_COMMUNICATION_SCHEDULER` | ✓ new route |
| Collector missed-payment in-app only for assigned group collector | ✓ `resolveCollectorUserIdForBorrower` |
| Admin summary only to `SUPER_ADMIN` role | ✓ |

## IDOR / horizontal escalation

Collectors receive in-app notifications only when `groups.collector_user_id` matches their assignment for the borrower's group. Notification `href` values use authorized routes (`/collector/payment/{borrowerId}`).

## Data minimization

SMS/email bodies include amount and due date only — no internal UUIDs, pool IDs, or ledger entry IDs.

## Deep links

Notification metadata does not embed privileged routes. Borrowers have no in-app inbox (no user accounts) — SMS/email only.

## Tests

Dedupe concurrency test (20 parallel → 1 slot). RBAC on scheduler via permission middleware.

## Residual

Live penetration test of notification APIs on staging — **operator gate**.
