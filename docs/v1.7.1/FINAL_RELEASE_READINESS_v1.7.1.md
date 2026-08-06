# Final Release Readiness — WILMS v1.7.1

## Gate checklist

| Gate | Status |
| --- | --- |
| Operational vs Executive separation | ✅ Implemented |
| Recent Activity authoritative | ✅ Implemented |
| Modal removeChild hardening | ✅ Implemented |
| PDF cover branding | ✅ Implemented |
| Financial/RBAC guarantees preserved | ✅ No formula/RBAC changes |
| Type-check / lint / tests | 🔄 Run before merge |
| Preview deploy smoke | 🔄 Required |
| Neon migrations | ✅ No new migration required for this packaging increment |
| Docs pack present | ✅ `docs/v1.7.1/` |

## Ship decision

**Conditional GO** after Preview validation of:

1. `/dashboard` work queue
2. `/executive` board framing
3. Recent Activity load for Super Admin
4. Modal open/close under Strict Mode (search, compose, settings)
5. PDF export cover page

## Rollback

Revert the packaging PR; no schema rollback required for this increment.
