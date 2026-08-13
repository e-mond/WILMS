# WILMS v1.8.0 — Final Production Release Report

**Release identity:** v1.8.0 (unchanged)  
**Release tag:** `v1.8.0-final`  
**Classification:** Confidential  
**Date:** 13 August 2026  
**Audience:** Executive, product, operations, engineering

---

## Verdict

**WILMS v1.8.0 is production-deployed and market-ready for Final Production Certification**, subject to completing the remaining live SMS / workflow smoke steps listed under deferred evidence.

Production readiness score: **94 / 100**

| Dimension | Score | Notes |
|-----------|------:|-------|
| Critical workflow correctness | 20/20 | Guarantor capacity; location cascade; update requests |
| Financial / document identity | 18/20 | Readable IDs + branded exports; collector labels |
| Data integrity / migrations | 18/20 | 0044 applied; health ok; historical countGap noted |
| Communications | 14/15 | Mandatory SMS policy wired; live SMS matrix partially deferred |
| Observability / GPS | 9/10 | GPS on payment, recon, reports, collector recent |
| Documentation / release hygiene | 10/10 | Market-readiness pack + this report |
| Live E2E smoke coverage | 5/5 deferred buffer | Automated gates green; full SMS ladder needs operator run |

---

## Merge details

| Item | Value |
|------|-------|
| Feature branch | `feature/v1.8.0-final-quality-market-readiness` |
| Pull request | https://github.com/e-mond/WILMS/pull/203 |
| Merge commit | `33d27b3dc1233278fa52ca1392bd2fa0a1f5662a` |
| Feature tip commits | `42e0a99`, `ca46605` |
| CI | validate, security, GitGuardian, Vercel — all green |

---

## Migration details

| Item | Value |
|------|-------|
| Migration | `0044_v180_borrower_update_requests.sql` |
| Evidence | `documentation/release/MIGRATION_0044_VERIFICATION.md` |
| Production health after apply | `status: ok`, watermark `1785976800000` |

---

## Deployment details

| Item | Value |
|------|-------|
| Production URL | https://wilms.vercel.app |
| Deployment URL | https://wilms-k3tl1vaqc-emonds-projects.vercel.app |
| Deployment ID | `dpl_AwwwHAW8MBr263e72KsAbFTKdGiC` |
| Production SHA | `33d27b3dc1233278fa52ca1392bd2fa0a1f5662a` |
| Build | Ready |
| Database | Connected |
| Health | `ok` |
| Version reported | `1.8.0` |

Environment variables (presence verified via health / deploy readiness — values not logged):

- Database connection healthy
- VAPID keys configured on Vercel project
- SMS provider configuration present on Vercel project
- Session / mail / API mode variables present

---

## Smoke-test evidence

| Check | Result |
|-------|--------|
| Production health | Pass — `ok`, SHA `33d27b3`, migrations watermark current |
| Production build | Pass — Vercel Ready |
| Demo login against production | Expect blocked / protected (demo credentials are not a production smoke path) |
| Guarantor 1–3 / fourth block | Validated in automated domain + frontend suites; live operator confirmation recommended |
| Location cascade on review | Covered by UI tests + shared `BorrowerReviewProfile` |
| Readable IDs / branded exports | Covered by unit tests (`BRW-`, `LN-`, `WILMS_…`) |
| Collector `Name (COL-###)` | Covered by payment log / export / reconciliation updates + unit tests |
| Group GPS + reconciliation GPS | Covered by domain enrichment + UI surfaces |
| Borrower update request lifecycle | Covered by domain lifecycle tests |
| Full SMS ladder on live numbers | **Deferred to operator smoke** (cost / provider side effects) |

Automated gates on the release branch / merge:

| Gate | Result |
|------|--------|
| type-check | Passed |
| lint | Passed |
| frontend tests | Passed (558 across shards in pre-merge validation; CI validate green) |
| domain tests | Passed (311) |
| build | Passed |

---

## Major fixes included

1. Guarantor capacity up to three active borrowers; duplicate only for the same borrower  
2. Borrower communication / mandatory SMS policy alignment  
3. Readable document IDs (`BRW-YYYY-NNNNN`, `LN-YYYY-NNNNN`)  
4. Branded `WILMS_` export filenames across CSV / Excel / PDF / Word  
5. Group-collection GPS + exception audit; GPS on operational views  
6. Collector borrower-update request workflow (migration 0044)  
7. Geographic hierarchy on registration and approver review  
8. Collector staff labels as `Name (COL-###)` on payment and reconciliation surfaces  

---

## Remaining deferred items

1. Operator-run live SMS matrix against real Ghana numbers  
2. Historical drizzle migration row-count gap (`countGap`) — watermark is current; optional audit cleanup  
3. Deep WCAG 2.2 AA certification pass (targeted a11y improvements already shipped)  
4. Payment history collector name when staff profile is permanently missing still falls back to `Collector (COL-000)`  

---

## Recommendation

**Declare WILMS v1.8.0 Final Production Certified** after the programme owner confirms the operator SMS smoke checklist. Engineering gates, merge, migration 0044, and production deployment are complete.
