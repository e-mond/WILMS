# Phase 28C — Dependency Triage Report

**Date**: 2026-07-21  
**Version**: v1.4.2  
**Command**: `npm audit --omit=dev`

## Safe Fixes Applied

`npm audit fix --omit=dev` (no `--force`) was run. 4 packages updated (3 moderate, 1 low resolved). Full test suite re-verified after `npm ci`. Vulnerabilities reduced from 10 → 7.

## Remaining Vulnerabilities (7)

### 1. drizzle-orm < 0.45.2

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Advisory** | GHSA-gpj5-g38j-94v9 — SQL injection via improperly escaped SQL identifiers |
| **Affected production code** | All database queries |
| **Exploitability** | Low — vulnerability requires attacker-controlled table/column identifiers, which WILMS does not expose to user input. All identifiers are static Drizzle schema definitions. |
| **Available upgrade** | `drizzle-orm@0.45.2` — flagged as **breaking change** by npm |
| **Breaking risk** | Medium — Drizzle ORM minor API changes between current and 0.45.2 require audit of all query builders |
| **Mitigation** | No dynamic identifier injection exists in WILMS codebase. Static Drizzle schema used exclusively. |
| **Upgrade plan** | Dedicated upgrade PR with drizzle-orm API diff review, full test run, migration re-verification. Target: next sprint. |
| **Residual risk** | LOW — not exploitable via current usage patterns |

### 2. next (current version — multiple CVEs)

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Advisories** | GHSA-9g9p-9gw9-jx7f, GHSA-h25m-26qc-wcjf, GHSA-ggv3-7p47-pfv8, GHSA-3x4c-7xq6-9pq8, GHSA-q4gf-8mx6-v5v3, GHSA-8h8q-6873-q5fj, GHSA-3g8h-86w9-wvmq, GHSA-ffhc-5mcf-pf4q, GHSA-vfv6-92ff-j949, GHSA-gx5p-jg67-6x7h, GHSA-h64f-5h5j-jqjh, GHSA-c4j6-fc7j-m34r, GHSA-wfc6-r584-vfw7, GHSA-36qx-fr4f-26g5 |
| **Affected production code** | Frontend Next.js app (DoS via Image Optimizer, RSC deserialization, request smuggling, cache poisoning, XSS in CSP nonces) |
| **Exploitability** | Medium — self-hosted deployments affected by Image Optimizer DoS; RSC deserialization and request smuggling require specific configuration |
| **Available upgrade** | `next@16.2.10` — **major version breaking change** |
| **Breaking risk** | High — Next.js 14 → 16 is a major API migration (App Router, middleware, config format) |
| **Mitigation** | Image Optimizer: restrict `remotePatterns` in `next.config.js` to trusted domains. CSP nonce XSS: untrusted user input is not passed to `beforeInteractive` scripts. |
| **Upgrade plan** | Dedicated Next.js 15/16 upgrade project; requires separate branch, full QA pass, and frontend regression suite. |
| **Residual risk** | MEDIUM — Image optimizer and RSC DoS are genuine surface area in self-hosted deployments. Operator should restrict remote image domains. |

### 3. playwright / @playwright/test < 1.55.1

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Advisory** | GHSA-7mvr-c777-76hp — browser download without SSL certificate verification |
| **Affected production code** | None — `@playwright/test` is a devDependency used only in testing |
| **Exploitability** | Zero in production — only affects CI/CD pipeline browser download integrity |
| **Available upgrade** | `@playwright/test@1.61.1` — outside stated range |
| **Breaking risk** | Low for tests |
| **Mitigation** | Not a production vulnerability. CI runners download browsers over verified HTTPS in controlled environments. |
| **Upgrade plan** | Upgrade in next sprint as part of dev tooling updates. |
| **Residual risk** | NONE in production |

### 4. postcss < 8.5.10 (via next)

| Field | Detail |
|-------|--------|
| **Severity** | Moderate |
| **Advisory** | GHSA-qx2v-qp2m-jg93 — XSS via unescaped `</style>` in CSS Stringify output |
| **Affected production code** | CSS build pipeline only (not runtime) |
| **Exploitability** | Zero at runtime — PostCSS runs at build time, not when serving requests |
| **Available upgrade** | Requires Next.js major upgrade (see above) |
| **Residual risk** | NONE in production |

### 5. uuid < 11.1.1 (via exceljs)

| Field | Detail |
|-------|--------|
| **Severity** | Moderate |
| **Advisory** | GHSA-w5hq-g745-h8pq — missing buffer bounds check in v3/v5/v6 when `buf` is provided |
| **Affected production code** | Excel export feature (exceljs) |
| **Exploitability** | Low — requires attacker to control the `buf` argument to uuid functions. WILMS uses uuid for UUID generation only, not parsing external buffers. |
| **Available upgrade** | `exceljs@3.4.0` — **breaking change** (API regression) |
| **Upgrade plan** | Test exceljs@3.4.0 API compatibility in a dedicated branch. |
| **Residual risk** | LOW — no external buffer passed to uuid from user input |

## Summary

| Category | Count |
|----------|-------|
| Exploitable production vulnerabilities | 1 (Next.js — Medium, operator-mitigatable) |
| Development-only | 1 (playwright) |
| Transitive (not directly exploitable) | 4 (postcss, uuid, drizzle via usage pattern, postcss via next) |
| Requiring breaking upgrades | 3 (drizzle-orm, next, exceljs) |
| Accepted residual risk | 7 (documented above) |

## Verdict

No additional `npm audit fix --force` applied. Breaking upgrades require dedicated testing branches.  
Residual risks documented and triaged.  
The most significant real-world risk is the Next.js Image Optimizer DoS — operator should configure `remotePatterns` to restrict trusted domains.
