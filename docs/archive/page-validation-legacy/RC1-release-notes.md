# RC1 Release Notes ÔÇö Phase 2

**Version:** v0.2.2  
**Date:** 2026-07-01  
**Branch:** `rc1/phase-2-production-hardening`

## Highlights

- **Zero placeholder toasts** ÔÇö group creation, pool creation, collector onboarding, messaging, group flagging all wired to live APIs
- **Risk flag CRUD** ÔÇö raise, escalate, resolve, assign
- **In-app messaging** ÔÇö admin Ôåö collector threads (`0010_messages` migration)
- **Notification dispatch** ÔÇö SMS/email channels in `sendNotification`; welcome email on user invite
- **API integrity** ÔÇö 135 frontend calls matched; coverage gate in CI
- **Production smoke** ÔÇö 7 additional authenticated BFF route probes

## Breaking changes

None.

## Deferred

- Server-side session revocation (force logout)
- MFA enrollment
- Next.js 15 / Drizzle patch (security roadmap)

## Upgrade

1. Merge PR to `main`
2. Railway redeploy (migration 0010)
3. Vercel auto-deploy
4. Run `npm run smoke:production`
