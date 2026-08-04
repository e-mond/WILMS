# SECURITY AUDIT — WILMS

**Audit date:** 2026-07-16  
**Audited code:** `main @ 10dfcbb`  
**Live evidence:** `/health` reports `status=ok`, `schema.status=ok`, `migrations.status=ok`

## 0. Scope (what was actually checked)

### Automated/static evidence collected
- `next lint` completed with **no ESLint warnings/errors** after:
  - XSS preview hardening
  - `ProductTourOverlay` exhaustive-deps fix
- Type-check completed (no type errors)
- Unit tests completed (backend+frontend)
- Targeted source scan for dangerous runtime patterns:
  - `eval`, `new Function`, `child_process`, `exec`, `spawn`  
  - **No matches found** in backend/frontend trees during this audit pass

### Dependency risk evidence collected
- `npm audit --production` reported vulnerabilities including:
  - `drizzle-orm` SQL injection advisory (audit suggests upgrade)
  - `next` multiple advisories (audit suggests breaking upgrade)
  - `postcss` moderate advisory (via Next upgrade path)
  - `playwright` SSL authenticity advisory (dev/test risk signal)
  - `uuid` moderate advisory (transitive via exceljs)

## 1. OWASP Top 10 — evidence mapping

### 1.1 A01: Broken Access Control
Evidence:
- API uses role-gated auth middleware (`requireAuth`) and route authorization gates.
- Backend RBAC permissions are unit-tested (e.g. financial endpoint RBAC audit tests exist and pass in unit test run).

Gap:
- Authenticated **production** RBAC smoke using real accounts was not executed here (credentials not provided to the agent).

### 1.2 A02: Cryptographic Failures
Evidence:
- Session mechanism uses HMAC / signed token session (health probe includes `session.provider=hmac-signed-token`).
- Session secret is required in production (`WILMS_SESSION_SECRET`).

Gap:
- Live session expiration / remember-me behavior validated only via code/test coverage; production E2E requires operator execution.

### 1.3 A03: Injection (SQL/HTML)
Evidence:
- Backend SQL probing uses `sql.raw` only with compile-time allowlists (`schema-health` probes a constant table allowlist).
- Rich text previews were a potential HTML injection vector; fixed as described below.

Dependency risk:
- `npm audit` flags a drizzle-orm advisory; upgrade is suggested as breaking. Code is not blindly trusted; see “Residual dependency risk”.

### 1.4 A04: Insecure Design
Evidence:
- Production `/health` reports migrations and schema integrity; avoids silent failures.

Gap:
- Live reconciliation workflows and report exports were not end-to-end executed with real accounts in this audit run.

### 1.5 A05: Security Misconfiguration
Evidence:
- Express app uses `helmet` with production-only CSP and HSTS.
- CORS is restricted via `env.corsOrigin` with `credentials: true`.
- Auth endpoints are rate-limited (`express-rate-limit` on forgot/reset/OTP verify).

### 1.6 A06: Vulnerable and Outdated Components
Evidence:
- `npm audit --production` flags advisories (Next, drizzle-orm, etc.).

### 1.7 A07: Identification & Authentication Failures
Evidence:
- Auth endpoints validate password + OTP challenges; demo accounts disabled in production smoke scripts (credentials required).

Gap:
- Authenticated production smoke (login/logout/remember me/reset/MFA/session expiry/app lock) not executed here due to missing operator credentials.

### 1.8 A08: Software Integrity Failures
Evidence:
- CI pipelines for PRs pass (for remediation/hardening PRs created during this process).

### 1.9 A09: Security Logging & Monitoring Failures
Evidence:
- Backend index logs unhandled rejections/uncaught exceptions.
- Audit log router and audit entries used around auth actions.

### 1.10 A10: Server-Side Request Forgery (SSRF) / Untrusted Fetch
Evidence:
- Backend uses server-side integrations; no direct dangerous fetch patterns found in targeted scan for runtime exec/eval.

## 2. Concrete findings & fixes applied

### Finding SEC-01 (High): Unsanitized rich-text previews rendered with `dangerouslySetInnerHTML`
Where:
- `apps/frontend/src/features/communication-center/components/RichTextEditor.tsx`
- `apps/frontend/src/features/communication-center/components/TemplateBuilderModal.tsx`

Why it mattered:
- User-composed HTML could contain script/event-handler payloads. Preview rendering could create XSS risk.

Fix applied:
- Added `apps/frontend/src/utils/html-sanitize.ts` (frontend port of backend allowlist sanitizer).
- Rich-text previews now render sanitized HTML:
  - RichTextEditor preview uses `sanitizeHtml(value)`
  - TemplateBuilderModal preview uses `sanitizeHtml(preview.bodyHtml)`

Residual:
- Sanitizer is regex/allowlist-based and intentionally lightweight. It covers script tags, inline event handlers, and dangerous protocols. Any sanitizer evolution still requires human review + regression testing.

### Finding SEC-02 (Low/Informational): `sql.raw` present in schema health probe
Where:
- `apps/backend/src/db/schema-health.ts`

Reasoning:
- The SQL targets a constant allowlist of table names derived from compile-time constants. This is not user-controlled input.

## 3. Residual dependency risk (requires operator decision)

`npm audit --production` reported multiple advisories that the audit tooling indicates would require breaking upgrades (including Next and drizzle-orm).

This sprint did not apply those upgrades automatically to avoid introducing runtime risk.

Recommended next step:
- Decide an upgrade window, then execute a dedicated dependency hardening PR with:
  - explicit changelog review
  - full unit tests
  - production smoke with real credentials
  - security re-scan after upgrade

## 4. Production security certification status

**Not fully certifiable here** because authenticated production smoke, RBAC per-role checks, backup/restore drill, and live E2E browser tests were not executed in this environment.

However, the live service health and schema integrity are currently green (`/health status=ok`), and one high-impact XSS preview risk was actively remediated in code.

