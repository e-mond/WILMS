# WILMS v1.8.0 — Production Readiness Matrix

**Branch:** `fix/v1.8.0-production-readiness`  
**Release identity:** `1.8.0` (no new tag / no retag of `v1.8.0`)  
**Base:** `origin/main` merge of PR #175 (`c1faa4c`)  
**Date:** 2026-08-09

## Verdict

**READY WITH CONDITIONS**

Local engineering gates pass (type-check, lint, frontend + domain tests, production build, version/migration/mock-guard/api-integrity verifies). Production host `https://wilms.vercel.app` responds with expected auth redirect and CSP (`font-src 'self' data:`; no googleapis). Full authenticated production smoke (`npm run smoke:production`) was not completed (`WILMS_APP_URL` unset). Deploy SHA vs live Vercel build was not proven without Vercel API credentials. Playwright a11y e2e timed out waiting for webServer (build-time Google font fetch network failures) — residual, not a claimed axe pass.

## Matrix

| Area | Status | Evidence |
|------|--------|----------|
| Engineering / branch | Pass | Branched from `origin/main` @ PR #175 merge; packages / `VERSION.md` = **1.8.0** |
| TypeScript | Pass | `npm run type-check` (frontend + domain) |
| Lint | Pass | `npm run lint` — no ESLint warnings/errors |
| Build | Pass | `npm run build -w @wilms/frontend` — Next.js 14 production build exit 0 |
| Frontend unit QA | Pass | Vitest shards: **270** + **269** tests passed; BorrowerList / LoanPortfolioList updated for stack+desktop dual mount |
| Backend / domain QA | Pass | `npm run test -w @wilms/domain` — **245** tests / **80** files |
| Financial | Pass | No formula changes; financial-integrity-p0 + financial-endpoints-rbac green (in domain suite) |
| RBAC | Pass | Domain RBAC suites green; document uploads keep `CAPTURE_DOCUMENTS` 403 |
| Security | Pass w/ notes | CSP live header confirmed; upload health surfaces Cloudinary misconfig; no RBAC weakening |
| Notifications | Pass | Preference-gate suite green (domain suite) |
| Automation | Pass | Engine + scheduler-http green (domain suite) |
| Offline | Pass (unit + docs) | OfflineBanner + Drawer + shells unit tests; `docs/offline-architecture.md` synced; device smoke **not** claimed |
| Accessibility | Conditional | Drawer focus restore hardened + unit tests; Playwright `accessibility` **failed to start** (webServer 120s timeout / fonts.gstatic ECONNRESET) — residual |
| Responsive | Pass (code) | Selective `mobileLayout="stack"` on ops lists; dense reports remain scroll |
| Uploads | Pass | Own profile-photo without capture perm; AttachmentUploader PermissionGate; health `uploads.valid` |
| CSP / fonts | Pass | `font-src 'self' data:`; serif `preload: false`; runtime CSP has no googleapis |
| Perf | Not re-baselined | No intentional perf regressions introduced |
| DB / Migrations | Pass / none new | Latest **0036–0039**; this unit **Required: NO**; `verify:migrations` READY |
| Docs | Pass | README 1.8.0 uplift; CHANGELOG note; this matrix; offline root doc |
| Production deploy | Conditional | `wilms.vercel.app` → 307 `/login`, CSP OK; SHA parity + `smoke:production` **not fully evidenced** |
| verify:version | Pass | All packages **1.8.0**; CHANGELOG contains `[1.8.0]` |
| verify:mock-guard | Pass | No forbidden mock imports in features/ |
| verify:api-integrity | Pass | Frontend apiClient paths matched to backend |

## Closure code changes (this unit)

- ShellNavIcon: removed unreachable duplicate `case 'messages'`
- Drawer: Modal-aligned portal/focus restore lifecycle + rapid open/close test
- AttachmentUploader: PermissionGate for `CAPTURE_DOCUMENTS`
- Selective DataTable stack on ops list panels (reports/audit remain scroll)
- Tests: BorrowerList / LoanPortfolioList use `getAllByText` for dual stack/table mount
- Docs: README 1.8.0, CHANGELOG, offline architecture + upload matrix, this matrix, FINAL readiness refresh

## Manual smoke checklist (operator)

- [ ] Confirm Vercel Production deployment SHA matches intended `main` / release commit
- [ ] Set `WILMS_APP_URL=https://wilms.vercel.app` and run `npm run smoke:production`
- [ ] Settings → profile photo upload (role without `CAPTURE_DOCUMENTS`)
- [ ] Collector dashboard: no Online navbar chrome / no quick-action grid
- [ ] Offline: online → offline → queue payment/expense → reconnect → sync → duplicate protection
- [ ] Playwright a11y on a machine with reliable build-time font download / cached `.next`

## Residuals

1. Authenticated production smoke not run (missing `WILMS_APP_URL` in this agent environment)
2. Deploy SHA vs live build not proven via Vercel API
3. Playwright accessibility suite did not execute (webServer timeout)
4. Full offline device smoke not performed this session

## Migration

**Required: NO** (no schema defect found; no new migration in this unit)
