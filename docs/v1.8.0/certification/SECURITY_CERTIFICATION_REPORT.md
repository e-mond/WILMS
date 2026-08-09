# WILMS v1.8.0 — Security Certification Report

**Generated (UTC):** 2026-08-09T19:29:30Z

## Verdict

**PASS WITH CONDITIONS** (static + headers + unit) — several interactive/provider gates BLOCKED

## Evidenced

| Control | Evidence |
|---------|----------|
| CSP (login) | `font-src 'self' data:`; no googleapis (`login-headers.txt`) |
| HSTS | Present on login + API |
| X-Content-Type-Options / frame options | Present |
| Auth model | HMAC session (health) |
| Demo login on live smoke | Disabled (smoke refuses demo credentials) |
| Upload MIME / magic bytes | Unit + photo-capture validation tests |
| RBAC / SoD | Domain suites PASS (`financial-rbac-sod.log`) |
| Request IDs | Observed on API (`X-Request-Id` on vapid 401) |
| Push route auth | VAPID key endpoint requires session (401 unauthenticated) |
| Secrets in health | No API secrets in `health.json` |

## Conditions / findings

| Item | Status |
|------|--------|
| `WILMS_CORS_ORIGIN` defaulting to `http://127.0.0.1:3000` on API responses | **NOTE** — confirm Production env override |
| Authenticated CSRF / session revocation / rate-limit abuse drills | BLOCKED without smoke user |
| Dependency CVE audit (`npm audit`) | Not executed this sprint → treat as **PENDING** |
| VAPID private key rotation / abuse prevention live drill | BLOCKED |
| Full XSS/CSRF browser suite | BLOCKED |

## Close criteria

Authenticated security smoke, `npm audit --omit=dev` evidence, confirm Production `WILMS_CORS_ORIGIN`, optional pen-test notes.
