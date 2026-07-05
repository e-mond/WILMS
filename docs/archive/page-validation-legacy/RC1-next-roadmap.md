# RC1 Next Roadmap

**Date:** 2026-07-01

## P1 ÔÇö Post-RC1 immediate

1. Automated welcome email on user invite (Gmail SMTP already configured)
2. Railway watch paths ÔÇö ensure `apps/backend/**` triggers deploy
3. Run Lighthouse audit on staging after RC1 deploy

## P2 ÔÇö Security & dependencies

1. Next.js 15 migration (addresses multiple high advisories)
2. Drizzle ORM upgrade to 0.45.2+ (SQL identifier advisory)
3. Playwright upgrade to 1.55.1+ (dev dependency)

## P3 ÔÇö Feature completion

1. Group creation workflow (currently "not yet available" toast)
2. Loan pool creation workflow
3. Collector onboarding workflow
4. In-app messaging between admin and collectors
5. Group flagging workflow

## P4 ÔÇö Operations

1. Automated production smoke in CI (post-deploy hook)
2. Staging environment with isolated DATABASE_URL
3. Git tag `v0.2.2-rc1` after stakeholder approval

## P5 ÔÇö Repository hygiene

1. Archive superseded `P14.6.*` validation docs
2. Delete local test artifact files (`vitest-*.txt`, `test-output.*`) after approval
