# WILMS v1.8.0 — Version Integrity Report

**Branch:** `fix/v1.8.0-production-certification`  
**Base:** `origin/main` @ `73e5b65d6a509b5c64f08f18e7266b59c72c0860`  
**Generated (UTC):** 2026-08-09T19:19:01Z  
**Method:** Local file reads + `npm run verify:version` + `npm run verify:migrations` + GitHub deployment API + production `/health`

## Verdict (this phase)

**PASS WITH NOTES**

Package / docs / CHANGELOG / production health all report **1.8.0**. Git tag `v1.8.0` is **missing** from the remote tag list (latest observed tags through `v1.7.4`). This is a release-ops note, not package drift.

## Package versions

| Artefact | Version | Evidence |
|----------|---------|----------|
| Root `package.json` | `1.8.0` | Local read + `verify:version` PASS |
| `@wilms/frontend` | `1.8.0` | Same |
| `@wilms/api` | `1.8.0` | Same |
| `@wilms/domain` | `1.8.0` | Same |
| `VERSION.md` | `v1.8.0` | Table + package table |
| `CHANGELOG.md` | `[1.8.0]` | Present; includes production-readiness closure note |
| `README.md` | `v1.8.0` | Badges + maturity section |
| Production health `version` | `1.8.0` | `evidence/health.json` |

## Git / deployment identity

| Field | Value |
|-------|-------|
| `origin/main` SHA | `73e5b65d6a509b5c64f08f18e7266b59c72c0860` |
| Latest Production GitHub deployment SHA | `73e5b65…` (id `5821873959`, created `2026-08-09T19:01:38Z`) |
| Production health `gitCommit` | `73e5b65d6a509b5c64f08f18e7266b59c72c0860` |
| Production `environment` | `production` |
| Git tag `v1.8.0` | **NOT FOUND** on remote (`git tag -l` shows through `v1.7.4`) |

SHA parity **main ↔ GitHub Production deployment ↔ live `/health`**: **MATCH**.

## Migrations

| Check | Result |
|-------|--------|
| Journal integrity | PASS (`verify:migrations`) |
| Latest SQL | `0036`–`0039` present |
| DB applied / expected | `39` / `40` with historical `countGap: yes`; `watermark_status: ok`; schema probe ok |
| Production health migrations | `status: "ok"`, same count gap |

## Environment configuration (observed, non-secret)

From production health (no secrets returned):

- Uploads: Cloudinary requested + active, `valid: true`
- Mail: `gmail` configured
- SMS: `smsnotifygh` configured
- Notifications: in-app available; push marked `optional` in health integrations summary
- Session: HMAC signed token
- Runtime: Node `v22.23.1`

## Notes / residuals

1. **No `v1.8.0` git tag** — operator may create annotated tag pointing at certified SHA after certification (out of scope to retag unless owner requests).
2. Local dirty edits to `package.json` / lockfile / `.env.production.example` were **reverted** before certification work to avoid unrelated drift.
3. This phase does **not** prove VAPID private key presence (secrets are not exposed by health); push certification is a separate phase.

## Evidence index

- `evidence/` (this pack) + command outputs from `verify:version` / `verify:migrations`
- Production health body: `evidence/health.json`
- GitHub deployment listing (API) for Production `73e5b65`
