# WILMS Production Guide

**Last updated:** P14.6.3 (v0.2.2)

---

## Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://wilms.vercel.app |
| API | https://wilms-production.up.railway.app |
| Health | https://wilms-production.up.railway.app/health |

---

## Baseline (verified)

- Migrations: **9/9** applied after P14.6.4 deploy (`0008_admin_extensions`); production may show 8/8 until redeploy
- Database: Neon PostgreSQL connected
- Uploads: Cloudinary connected
- Sessions: HMAC tokens working
- Smoke tests: **17/17** (v0.2.2)

---

## Health Endpoint

`GET /health` returns:

```json
{
  "data": {
    "status": "ok",
    "version": "0.2.2",
    "gitCommit": "...",
    "uptimeSeconds": 1234,
    "environment": "production",
    "migrations": { "expected": 8, "applied": 8, "status": "ok" },
    "runtime": {
      "nodeVersion": "v20.x",
      "deployedAt": "ISO-8601",
      "buildId": "railway-deployment-id"
    }
  }
}
```

No secrets exposed.

---

## Version Display

UI shows `WILMS v0.2.2` from root `package.json`:

- Login page
- Sidebar footer
- Dashboard footer (`OfficeShellFooter`)
- Settings panel

---

## Credential Hygiene

Demo seed users (`*@wilms.demo`) should be suspended before stakeholder rollout:

```bash
npx tsx apps/backend/scripts/rotate-production-users.mjs
```

Output: `.wilms-production-credentials.json` (gitignored, distribute out-of-band).

---

## Monitoring Checklist

1. `/health` returns HTTP 200, `status: ok`
2. Migrations count matches journal
3. `npm run smoke:production` passes
4. No mock mode on production frontend

---

## Documentation Index

| Topic | Document |
|-------|----------|
| Hardening | `page-validation/P14.5G-production-hardening-report.md` |
| Security | `security-guide.md`, `page-validation/P14.5G-security-audit.md` |
| Deployment | `deployment-guide.md`, `page-validation/P14.5G-deployment-report.md` |
| Release notes | `docs/releases/v0.2.2.md`, `CHANGELOG.md` |
| Recovery | `page-validation/P14.6.3-production-acceptance.md` |
| Future work | `page-validation/P14.5G-future-roadmap.md` |
