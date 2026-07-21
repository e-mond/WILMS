# UX / UI Audit — Phase 26 (v1.4.1)

**Date:** 2026-07-21  
**Baseline:** UX modernisation pack + shell hardening (PR #132 / #133 / #136)  
**Phase 26 focus:** Security/financial remediations — **no redesign** of shell chrome

---

## Inherited UX posture (merged before this branch)

| Item | Status | Notes |
|------|--------|-------|
| Dashboard ≠ Operations routing | Shipped | `/ops` in permission matrix |
| Sticky header + full-height sidebar | Shipped | Enterprise shell |
| FloatingActionStack (Help + connectivity) | Shipped | No overlap |
| Permission Catalog search/copy | Shipped | |
| Login password INP + mobile sidebar `forceExpanded` | Shipped via PR #136 | |
| Collector Messages removed | Shipped | Tour aligned |

---

## Phase 26 UX-facing deltas (Verified)

| Surface | Change | Evidence |
|---------|--------|----------|
| Complete profile / reset password | Min length **10** + letter/number messaging | FE forms; API `password-policy` |
| Invitation expiry errors | Clear expired-invitation message on login/accept | `INVITATION_EXPIRED_MESSAGE` |
| Adjustment / loan approve | Validation errors when self-approving | API messages surfaced via existing error paths |

No new marketing landing or hero work in this phase.

---

## Residual UX notes

| ID | Finding | Severity | Action |
|----|---------|----------|--------|
| P26-UX-01 | Visual QA after deploy still operator-owned | — | Collector + Approver keyboard/visual pass |
| P26-UX-02 | Report 422 messages need operator understanding | Low | Documented in ops/manual actions |
| P26-UX-03 | No Phase 26 redesign of regex-sanitized HTML display | Medium | Tied to sanitizer backlog |

---

## Explicit non-claims

- No new WCAG full re-audit of every page in this pack (see [ACCESSIBILITY_REPORT.md](./ACCESSIBILITY_REPORT.md)).  
- No claim of Production Certified UX seal.

**Related packs:** [`../ux-modernisation/`](../ux-modernisation/), [`../final-system-audit/FINAL_UI_UX_AUDIT.md`](../final-system-audit/FINAL_UI_UX_AUDIT.md).
