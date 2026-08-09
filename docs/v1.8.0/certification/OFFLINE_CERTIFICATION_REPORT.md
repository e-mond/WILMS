# WILMS v1.8.0 — Offline Certification Report

**Generated (UTC):** 2026-08-09T19:28:00Z

## Verdict

**PASS (documentation + unit) — device offline smoke BLOCKED**

## Documented capability matrix (code truth sources)

From `docs/offline-architecture.md` / `docs/v1.8.0/OFFLINE_*`:

| Capability | Mode |
|------------|------|
| Payment write | Full offline → batch → approver conflict review |
| Expense write | Full offline → direct apply when online |
| Holiday create | Full offline write |
| Dashboard / notification reads | IndexedDB snapshots |
| Shell navigation | SW `wilms-v180-shell` |
| Approvals / recon decisions / registration / reports | Online-only |

## Automated evidence

OfflineBanner / offline queue unit tests are part of the frontend Vitest suite (pipeline shards). Device DevTools offline + queue + sync + conflict UX **not executed** in this agent environment.

## Device / tablet / mobile offline

**BLOCKED** — requires real browser with `navigator.onLine` false, service worker active on production origin, and authenticated collector session.

## Close criteria

Checklist with screenshots: online→offline→queue payment→reconnect→sync→duplicate protection; conflict visible to approver.
