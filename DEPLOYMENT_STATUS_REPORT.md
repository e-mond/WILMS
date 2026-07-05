# WILMS — Deployment Status Report

**Audit date:** 2026-07-04 · **Commit:** `487708b`

---

## Environment map

| Service | URL | Role |
|---------|-----|------|
| Frontend (Vercel) | https://wilms.vercel.app | Next.js 14, BFF, static/SSR |
| Backend (Railway) | https://wilms-production.up.railway.app | Express API |
| Database (Neon) | Via `DATABASE_URL` on Railway | PostgreSQL |
| Uploads (Cloudinary) | Configured on Railway | Production file storage |

---

## Version & commit synchronization

| Target | Version | Git commit | Verified |
|--------|---------|------------|----------|
| `package.json` (root) | 0.2.2 | — | Yes |
| Railway `/health` | 0.2.2 | `487708b1a328a1dace69990ec885c3e045ed9f9a` | Yes |
| Local HEAD | 0.2.2 | `487708b` (same) | Yes |
| Vercel frontend SHA | **Not exposed in API** | Assumed from `main` auto-deploy | **Partial** — login page 200, no commit header checked |
| `verify:deploy-sync` | — | **PASS** | 2026-07-04 |

### Production `/health` snapshot

```json
{
  "status": "ok",
  "version": "0.2.2",
  "gitCommit": "487708b1a328a1dace69990ec885c3e045ed9f9a",
  "database": { "connected": true },
  "migrations": { "expected": 13, "applied": 13, "status": "ok" },
  "schema": { "status": "ok", "missingTables": [] },
  "uploads": { "activeProvider": "cloudinary", "cloudinaryConfigured": true },
  "runtime": { "nodeVersion": "v20.20.2", "environment": "production" }
}
```

---

## GitHub

| Item | Status |
|------|--------|
| Repository | `e-mond/WILMS` |
| Default branch | `main` @ `487708b` |
| Open PRs | **Not verified** — `gh` not authenticated |
| CI workflows | **Not verified** this audit |

---

## Railway

| Item | Status |
|------|--------|
| Project | WILMS (linked CLI) |
| Service | Online — region SFO |
| Last redeploy | From source after `487708b` push |
| Env vars (SMS/email) | Operator-configured — integration status available via settings API |
| Build ID | Distinct from gitCommit (expected) |

---

## Vercel

| Item | Status |
|------|--------|
| Production URL | https://wilms.vercel.app |
| Login page | HTTP 200 |
| CSRF endpoint | HTTP 200 |
| Demo banner on login | Absent (production smoke PASS) |
| BFF proxy | Working for all smoke-tested paths |

---

## Neon

| Item | Status |
|------|--------|
| Connected | Yes |
| Migrations | 13/13 applied |
| Data contents | **Not SQL-audited** this pass |

---

## Cloudinary

| Item | Status |
|------|--------|
| Provider | `cloudinary` (requested + active) |
| Health flag | `valid: true`, `cloudinaryConfigured: true` |

---

## Environment variables (expected)

| Variable | Layer | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Railway | Neon connection |
| `WILMS_SESSION_SECRET` | Railway | Session signing |
| `CLOUDINARY_*` | Railway | Uploads |
| `SMS_*` / email vars | Railway | Notifications |
| `WILMS_API_UPSTREAM` | Vercel | BFF proxy target |
| `NEXT_PUBLIC_API_BASE_URL` | Vercel | Client API base |
| `EXPECTED_GIT_COMMIT` | Local/CI | Smoke git parity — **currently stale in local `.env`** |

---

## Frontend/backend sync checklist

| Check | Result |
|-------|--------|
| API version matches package | Yes (0.2.2) |
| Git SHA on Railway matches `main` | Yes |
| BFF reaches Railway | Yes |
| Migrations applied before API serve | Yes |
| Mock mode disabled in production | Yes (no demo banner) |

---

## Recommendations

1. Add Vercel deployment SHA to smoke test (deployment API or `x-vercel-id` header logging)  
2. Automate `verify:deploy-sync` in CI on every `main` push  
3. Document Railway + Vercel env var matrix in deployment runbook  
4. Run production data cleanup dry-run after each major deploy
