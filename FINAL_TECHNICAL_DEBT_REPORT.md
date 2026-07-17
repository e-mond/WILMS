# FINAL_TECHNICAL_DEBT_REPORT.md

**Version:** 1.3.8 · **Date:** 2026-07-17

## Debt Retired This Pass

| Debt | Resolution |
|---|---|
| Orphan hooks/utils/components | Deleted |
| Unused design primitives without consumers | Deleted |
| Orphan 1.2MB asset | Deleted |
| Duplicate phone normalize (notifications) | Use shared SMS helper |
| No-op bottom-nav filter | Removed |
| Stale version docs | Synced to 1.3.8 |
| Incomplete dialog a11y on update prompt | Fixed |
| Drawer AT bug during close | Fixed |

## Remaining Technical Debt (Accepted)

| Item | Severity | Class |
|---|---|---|
| Large wizards/panels (registration, settings views) | Medium | Maintainability — do not refactor under freeze |
| FE middleware trusts decode-only session for UI routes | Medium | Security defense-in-depth |
| Regex HTML sanitizer (not DOMPurify) | Medium | Security partial |
| Payment Idempotency-Key optional | Medium | Integrity |
| Upload MIME client-claimed | Medium | Security partial |
| Messaging N+1 summary queries | Low | Performance at scale |
| Historical root `*_REPORT.md` sprawl | Low | Docs hygiene |
| npm audit 18 vulns (incl. breaking Next) | High | External / upgrade sprint |

## Recommendation

Open a post-1.3.8 maintenance track for: DOMPurify, Next major upgrade, mandatory payment idempotency, and wizard decomposition — **after** certification deploy.
