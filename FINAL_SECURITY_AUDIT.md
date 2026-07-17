# FINAL_SECURITY_AUDIT.md

**Release candidate:** v1.3.8  
**Date:** 2026-07-17  
**Method:** Code review + `verify:financial` security suite (11/11) + regression tests

## Executive Summary

Critical and high application-layer issues identified during certification were **fixed in this sprint**. Residual risks are medium/low or require operator configuration / dependency upgrades.

## Fixed This Sprint (Critical / High)

| ID | Severity | Finding | Fix |
|---|---|---|---|
| SEC-001 | CRITICAL | `/api/mail/gmail` trusted unsigned session cookie | Verify session against API with HMAC Bearer |
| SEC-002 | HIGH | Message thread `adminId` IDOR | Bind admin to session; require admin permission |
| SEC-003 | HIGH | `POST /notifications` open to any auth user | Require `MANAGE_COMMUNICATIONS` or `MANAGE_USERS` |
| SEC-004 | HIGH | Registration delete `officerId` IDOR | Use `resolveOfficerIdForList` |
| SEC-005 | HIGH | Approver reviewed list IDOR | Same officer-id resolution |
| SEC-006 | HIGH | Upload size trusted client `sizeBytes` | Enforce decoded `buffer.length` |
| SEC-007 | HIGH | Generic mail webhook unauthenticated | Require `MAIL_WEBHOOK_SECRET` |
| SEC-008 | HIGH | Resend webhook fail-open without secret | Fail closed (503/401) |
| SEC-009 | HIGH | Payment/reversal actor spoofing | Actor from session; collectorId bound for collectors |

Regression tests: `apps/backend/src/tests/security/hardening-regressions.test.ts` (3/3 pass)

## Automated Security Suite

`npm run verify:financial` → Security/RBAC **11/11 pass** including forged token, RBAC denials, login rate limit.

## Remaining Findings

| ID | Severity | Status | Notes |
|---|---|---|---|
| SEC-010 | MEDIUM | Open | Frontend middleware UI RBAC uses decode-only session (no HMAC). API still authoritative. |
| SEC-011 | MEDIUM | Partial | Regex HTML sanitizer (not DOMPurify); SVG/data hardening improved |
| SEC-012 | MEDIUM | Open | Payment `Idempotency-Key` optional (offline sync requires it) |
| SEC-013 | MEDIUM | Open | Upload MIME from client claim (no magic-byte validation) |
| SEC-014 | MEDIUM | Open | Photo-capture tokens ~64-bit entropy; no public rate limit |
| SEC-015 | LOW | Open | npm audit: 8 vulns (Next/exceljs/uuid) — breaking upgrades deferred |
| SEC-016 | INFO | Accepted | Demo plaintext password fallback only when DB disabled |

## Penetration Themes

| Theme | Result |
|---|---|
| IDOR | Critical gaps fixed; residual media/upload MIME risks |
| Privilege escalation | API `requirePermission` solid; gmail route fixed |
| JWT/session tampering | API HMAC verified; forged tokens rejected |
| CSRF | BFF double-submit enforced |
| XSS | Hardened sanitizer; not DOMPurify-complete |
| SQLi | Parameterized Drizzle — no evidence of injection |
| File upload | Size enforced; MIME magic-byte gap remains |
| Rate limit | Login limited; general API limits not present |
| Replay | Idempotency available; not mandatory on all payment POSTs |

## Certification Impact

**Application security gate: CONDITIONAL PASS** — critical/high app issues resolved. Medium items accepted for post-cert hardening backlog. Dependency CVEs require separate upgrade window.
