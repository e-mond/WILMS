# Phase 33 — Penetration Test Report (OWASP-oriented, local)

**Identity:** WILMS v1.8.0  
**Scope:** Local/domain HTTP + static review only (no authenticated production abuse)

## Method

Static review of auth, authZ, CSRF/CORS, uploads/magic bytes, photo-capture public routes, scheduler tokens, push subscribe. Adversarial unit tests under `packages/domain/src/tests/phase33/` and existing photo-capture / scheduler suites.

## Findings

| ID | CVSS-style | Exploitability | Status | Notes |
|----|------------|----------------|--------|-------|
| H3 | Medium (6.5) | Token spray on CSRF-exempt capture upload | Remediated | Token was `pcs_` + 16 hex (~64 bit); now full UUID hex (128 bit) |
| H4 | Medium (5.3) | Staging/prod CORS misconfig to localhost default | Remediated | Serverless/production validate-env fails closed on localhost/unset CORS |
| H7 | Medium (5.0) | Wrong scheduler bearer + privileged session fallthrough | Remediated | Wrong presented token → 401, no session fallback |
| H8 | Low–Medium (4.3) | Authenticated push endpoint spam | Remediated | Cap 10 subscriptions / user |
| Auth CSRF gap | Info | Direct `:4000` API without BFF CSRF | Residual | Documented architecture; BFF path remains primary |
| Magic-byte uploads | Info | Polyglot blocked by existing validators | Residual | Covered by upload/photo-capture validation tests |

## PoC evidence

- Token entropy: `buildPhotoCaptureSessionToken` → `/^pcs_[0-9a-f]{32}$/`
- CORS: `validateEnvironment()` invalid when `VERCEL=1` + unset `WILMS_CORS_ORIGIN`
- Scheduler: `requireSchedulerAccess` with wrong Bearer calls `next(AppError 401)`
- Push: 11th distinct endpoint rejected in memory mode

## Remediations shipped

Photo-capture token, CORS validation, scheduler fail-closed, push cap — each with automated regression tests.
