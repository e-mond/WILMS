# RC1 Production Readiness

**Date:** 2026-07-01  
**Release:** v0.2.2 RC1

## Deployment targets

| Service | URL | Platform |
|---------|-----|----------|
| Frontend | https://wilms.vercel.app | Vercel |
| API | https://wilms-production.up.railway.app | Railway |

## Pre-deploy checklist

- [x] CI validate passes (lint, type-check, build, tests)
- [x] CI security passes (critical audit)
- [x] API integrity 112/112
- [x] Bundle budgets pass
- [x] Vercel production redeploy from `main` (post PR #35 merge) — frontend 200
- [x] Railway health — 200, DB connected, migrations 9/9 applied (0009 pending next deploy)

## Environment variables

### Vercel

- `NEXT_PUBLIC_API_BASE_URL` = `https://wilms.vercel.app/api/wilms`
- `WILMS_API_UPSTREAM` = `https://wilms-production.up.railway.app`
- `WILMS_SESSION_SECRET` (matches backend)

### Railway

- `DATABASE_URL`, `WILMS_SESSION_SECRET`, `WILMS_CORS_ORIGIN`
- `SMS_PROVIDER`, `SMSNOTIFYGH_*` (if SMS enabled)
- `MAIL_PROVIDER=gmail`, `GMAIL_*` (if email enabled)
- `UPLOAD_PROVIDER=cloudinary`, `CLOUDINARY_*`

## Smoke tests

| Test | Expected |
|------|----------|
| `GET /health` | 200 — PASS (2026-07-01) |
| Frontend home | 200 — PASS |
| Login (Super Admin) | Manual — required post-merge |
| `/dashboard` | Manual — required post-merge |
| `/settings` | Manual — required post-merge |

## Verdict

**READY** — automated smoke PASS; manual auth/dashboard/settings verification after RC1 PR merge.
