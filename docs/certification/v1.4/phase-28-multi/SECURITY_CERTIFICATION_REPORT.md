# Security Certification Report

**Version:** 1.4.2 | **Date:** 2026-07-21

## Authentication — Code Verified

| Control | Status |
|---------|--------|
| Session-based auth + JWT | ✓ |
| Password policy (min 10, letter+number) | ✓ + tested |
| Invitation tokens (SHA-256 hash, single-use) | ✓ + tested |
| Invite expiry (7 days fail-closed) | ✓ |
| Rate limit on accept-invitation | ✓ |
| CSRF at BFF layer | ✓ |
| Production requires WILMS_SESSION_SECRET | ✓ |

## Authorization / RBAC — Code Verified

| SoD Control | Enforced | Tested |
|-------------|----------|--------|
| Expense approve | ✓ | ✓ |
| Adjustment approve | ✓ | ✓ |
| Loan approve | ✓ | ✓ (new) |
| Borrower approve | ✓ (new) | ✓ (new) |
| Reconciliation review | ✓ (new) | ✓ (new) |
| Sync conflict approve | ✓ (new) | ✓ (new) |
| Overpayment resolve | ✓ (new) | ✓ (new) |

Backend `requirePermission` enforced on all sensitive routes. UI permissions are not the sole protection.

## Input / Data Security

| Area | Status |
|------|--------|
| Upload magic-byte validation | ✓ |
| Upload size limits | ✓ |
| Upload routes now require CAPTURE_DOCUMENTS | ✓ (new) |
| Global error handler sanitizes 500s | ✓ |
| BFF upstream errors sanitized | ✓ (new) |
| Email click redirect allowlist | ✓ (new) |
| SQL via Drizzle parameterized queries | ✓ |

## Secrets Audit

No production secrets committed. Demo credentials only in `seed/demo-users.ts` with production guard.

## Live Security Smoke

**BLOCKED** — requires staging credentials. See FINAL_MANUAL_ACTIONS_REQUIRED.md.

## Status

**PASS (code-level)** | Live smoke **BLOCKED**
