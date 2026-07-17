# WILMS External Enterprise Software Audit

**Engagement type:** Black-box / gray-box enterprise audit  
**Subject:** WILMS (Women's Interest-Free Loan Management System)  
**Auditor posture:** Independent third-party assessor — no trust in vendor claims, UI copy, mock behaviour, or prior certification reports  
**Audit date:** 17 July 2026  
**Production API observed:** `https://wilms-production.up.railway.app`  
**Production app observed:** `https://wilms.vercel.app`  
**Observed build:** API `v1.3.8` (`gitCommit` at time of probe varied during deploy window; health reported migrations `expected=27`, `applied=26`, `status=ok`)

---

## Executive verdict

WILMS presents as a production microfinance operations platform with role-based portals, interest-free lending, field collection, reconciliation, and reporting. Against that claim set, the system is **not enterprise-certified**.

**Overall risk rating: HIGH**

The platform has meaningful authentication boundaries on many routes and recent security hardening, but core **financial controls are inconsistently enforced**, several **segregation-of-duties failures** exist, and **dashboard/cash figures are not a closed ledger**. Marketing and UI statements frequently overstate backend behaviour (mock-only gates, expenses “deducted,” approval workflows that are optional on the live API).

**Do not treat prior internal “production certified” documents as external assurance.**

---

## Methodology

| Activity | Result |
|---|---|
| Unauthenticated HTTP probing of production API/app | Auth required on business routes; `/health` public; demo login rejected |
| Contract and route review (API permissions, schemas) | Cross-checked role matrix vs money-moving endpoints |
| Adversarial workflow analysis | Loan, payment, reconcile, expense, pool, invitation |
| Financial invariant review | Ledger types, fees, reversals, dashboards, pools |
| Operational signal review | Health payload, workers, mail/SMS, migrations |

**Not performed (credentials / infrastructure access required):** authenticated penetration of live data, concurrency stress on Neon, end-to-end mail delivery forensics, WAF/rate-limit measurement, device/PWA field trials.

---

## Production surface snapshot

| Probe | Observation |
|---|---|
| `GET /health` | 200; DB connected; Cloudinary valid; Gmail + SMS marked configured |
| Business routes without auth | 401 |
| Demo login `admin@wilms.demo` | Rejected (`UNAUTHORIZED`) — demo accounts appear disabled live |
| Migrations | `expected: 27`, `applied: 26`, yet `status: "ok"` — **health signal is contradictory** |
| Workers | `redis: not_used`, `queue: in_process`, `scheduler: http_triggered` — no durable job bus |
| Push | Marked `optional` |
| Frontend | Login reachable; many app routes redirect (auth gate) |

---

## Findings (by severity)

### Critical

#### C-01 — Admin-fee disbursement gate is not enforced on the live API
**Claim under test:** Loans cannot be disbursed without admin fee.  
**Evidence:** Backend `getDisbursementEligibility` returns `canDisburse: true` whenever a `PENDING_DISBURSEMENT` loan exists; `createLoan` / `disburseLoan` do not call admin-fee checks. Mock/UI enforce the fee.  
**Break:** Privileged API client creates and disburses without fee.  
**Impact:** Fee leakage; UI/BRD false assurance; books diverge from field cash.  
**Remediation:** Enforce fee presence in create and disburse services; integration tests must hit the API, not mocks.

#### C-02 — “Approval before disbursement” is not a real control on the primary path
**Evidence:** Loan insert lands in `PENDING_DISBURSEMENT`; same permission class can create and disburse; `approveLoan` is not required for the happy path.  
**Break:** Single actor funds a borrower without a second control.  
**Impact:** Maker-checker failure on capital outflow.  
**Remediation:** Explicit state machine: draft → approved → pending disbursement → disbursed, with separated permissions.

#### C-03 — Expenses are recorded, not deducted from any cash engine
**Claim under test:** Expenses are deducted from operational balances.  
**Evidence:** Expense create inserts an `APPROVED` row; no pool allocation, no ledger entry, no capital reduction. Dashboards subtract expenses only in presentation formulas.  
**Break:** Large expense makes screens look worse while lending capacity is unchanged — or expenses are omitted and capital looks healthy while cash left the field.  
**Impact:** False cash position for leadership decisions.  
**Remediation:** Post expenses to a real cash/operating ledger and reconcile dashboard to that ledger.

#### C-04 — Payment reversal leaves pools and progress dirty
**Evidence:** Reversal restores loan-side balance; pool allocation unwind is explicitly out of scope; repayment progress sums `REPAYMENT` and ignores `REVERSAL`.  
**Break:** Reverse a large collection → loan looks correct, pool “collected” and progress remain inflated.  
**Impact:** Capital and portfolio KPIs lie after corrections.  
**Remediation:** Symmetric pool allocations on reverse; net ledger in progress calculations; forbid “out of scope” for money movement.

#### C-05 — Holiday-shifted due dates can deadlock collections
**Evidence:** Holidays shift due dates forward; payment posting requires weekday match to `paymentDay`; tests encode Friday→Saturday shifts. Equal weekly amounts collide with same-day duplicate rules.  
**Break:** After a holiday, neither the shifted date nor the original weekday accepts a clean weekly payment without operational workarounds.  
**Impact:** Field collection stalls; forced manual overrides; trust loss.  
**Remediation:** Align payment-day rule with shifted due dates, or adjust schedule weekday with the holiday.

---

### High

#### H-01 — Reconciliation `collectorId` is client-supplied (IDOR)
**Evidence:** Submit/list accept `collectorId` from body/query without binding collectors to `session.userId`.  
**Break:** Collector A submits or inspects Collector B’s reconciliation.  
**Impact:** Fraudulent close-out; peer financial exposure.  
**Remediation:** Force `collectorId = session.userId` for collectors; scope list/get.

#### H-02 — Payments lack borrower-assignment enforcement
**Evidence:** Payment recording requires `RECORD_COLLECTIONS` only; borrower assignment checks used on borrower reads are not applied.  
**Break:** Any collector posts against another collector’s borrower.  
**Impact:** Misattributed cash; reconciliation distortion.  
**Remediation:** Require assignment (or admin override) server-side.

#### H-03 — Auditors can approve/reject reconciliations
**Evidence:** `PATCH /reconciliations/:id/review` gated by `VIEW_REPORTS`; auditors hold that permission. UI implies Super Admin.  
**Break:** Read-only auditor mutates cash-control outcomes.  
**Impact:** Segregation-of-duties breach.  
**Remediation:** Dedicated permission; exclude Auditor.

#### H-04 — Collectors hold `MANAGE_GROUPS`
**Evidence:** Shared RBAC grants collectors `MANAGE_GROUPS`; group mutation APIs use it; nav hides `/groups` but route/API remain.  
**Break:** Collector reassigns members/collectors org-wide via API.  
**Impact:** Portfolio takeover / routing abuse.  
**Remediation:** Scope to assigned groups or remove permission.

#### H-05 — Reconciliation auto-approves dangerous cases
**Evidence:** Variance flagged only above 10% of expected due; when `expectedDue = 0`, variance is never flagged → auto-`APPROVED` for arbitrary physical cash.  
**Break:** Non-collection-day or zero-due submit with fabricated cash closes clean.  
**Impact:** Systematic cash-control bypass.  
**Remediation:** Absolute currency threshold; never auto-approve when physical ≠ system recorded; never auto-approve zero-expected with non-zero cash.

#### H-06 — Fixed invitation password `ChangeMe1!`
**Evidence:** Settings/collector invite flows hash and transmit a constant temporary password.  
**Break:** Attacker who knows invite email attempts login before onboarding completes.  
**Impact:** Staff account takeover (including elevated roles).  
**Remediation:** Per-invite random secret or magic-link only; single-use set-password.

#### H-07 — Pool capital is not a hard disbursement limit
**Evidence:** Disbursement does not assert `disbursed + amount ≤ capital`; utilisation is post-hoc and capped at 100%.  
**Break:** Over-lend relative to pool capital.  
**Impact:** Fund over-commitment.  
**Remediation:** Fail closed on insufficient pool capacity.

#### H-08 — Dashboard / report totals are not a single source of truth
**Evidence:** Collections path can include reversed payments and pagination caps; pools use `Math.max(pool, portfolio)` overlays; ledger report omits disbursements/fees/reversals; collection-rate formula mixes lifetime payments with “this week due.”  
**Break:** Leadership compares screens and gets incompatible answers.  
**Impact:** Misinformed capital and performance decisions.  
**Remediation:** One append-only ledger; every KPI derived from it; fail when sources disagree.

#### H-09 — Same-day payment “edit” is theatre
**Evidence:** `PATCH /payments/:id` writes audit and returns edited status without mutating amount/balance/schedule/DB persistence path used for real payments.  
**Break:** Operator believes a correction happened; books unchanged.  
**Impact:** Silent operational error.  
**Remediation:** Implement real edit-via-reversal+repost, or remove the endpoint.

#### H-10 — Rejected/reopened reconciliations cannot be resubmitted cleanly
**Evidence:** Existence of any row for collector+date blocks resubmit.  
**Break:** After reject, collector is locked out of a corrected submission.  
**Impact:** Ops deadlock; shadow spreadsheets.  
**Remediation:** Allow superseding submit from `REJECTED`/`REOPENED` with history trail.

---

### Medium

| ID | Title | Summary |
|---|---|---|
| M-01 | Optional Idempotency-Key | Money POSTs can race without key → double post risk |
| M-02 | Frontend middleware trusts unsigned session payload | UI RBAC cosmetic; risk of privileged UI leakage |
| M-03 | Photo-capture token entropy / no public rate limit | Short tokens; CSRF-exempt capture surface |
| M-04 | Upload MIME trusted from client | No magic-byte validation |
| M-05 | Expense API weak validation + leftover review/PENDING schema | Product says no approval; schema/API still approval-shaped; no money audit |
| M-06 | GPS optional on API, required in UI | Direct API skips field control |
| M-07 | Auth-only rate limits; 15mb JSON | Authenticated DoS / large-body risk |
| M-08 | Plaintext password compare fallback | Non-bcrypt hashes still verify |
| M-09 | Demo seed password reset risk | Seed upsert can reintroduce known demos if run in wrong env |
| M-10 | `INTEREST_CHARGE` ledger taxonomy | Zero-amount interest entries undermine interest-free narrative |
| M-11 | Admin fee outside loan ledger | Fee not append-only with repayments/disbursements |
| M-12 | Aggressive client polling | 10–30s polls amplify API load |
| M-13 | In-process queues / HTTP-triggered scheduler | No durable workers; jobs die with process |
| M-14 | Migration health contradiction | `expected≠applied` but status `ok` |

---

### Low / Informational

| ID | Title | Notes |
|---|---|---|
| L-01 | Regex HTML email sanitizer | Improved to keep `<style>`; still not a purpose-built email sanitizer |
| L-02 | Soft-delete vs financial FK retention | Document retention policy needed |
| L-03 | Dependency CVEs | Track Next/exceljs/uuid advisories |
| L-04 | VAPID optional | Push silently degrades without keys |
| L-05 | Gmail-on-Railway operational coupling | Mail depends on Vercel relay secrets/quotas |
| I-01 | Demo logins rejected in production probe | Positive control |
| I-02 | Unauthenticated business APIs return 401 | Positive control |
| I-03 | Mock provider hard-disabled in production build alias | Positive control (if build pipeline intact) |

---

## Workflow kill-chain summary

```text
Registration → Approval → Admin fee → Loan create → Disburse → Collect → Reconcile → Expense → Report
     |            |           |            |           |          |          |          |         |
   OK-ish      soft gate   API bypass   no maker-   no capital  assign-   IDOR +     not      numbers
                           (mock-only)  checker     hard stop   ment gap  auto-approve  real cash  disagree
```

An external auditor concludes: **controls shown in demos/UI are not the controls that protect production money.**

---

## Security control scorecard

| Control domain | Rating | Comment |
|---|---|---|
| Authentication presence | Adequate | Most business routes require auth; demos blocked in live probe |
| Session integrity (API) | Adequate | HMAC-signed tokens |
| CSRF (BFF) | Partial | Present; capture routes exempt |
| Authorisation / SoD | Weak | Auditor review; collector group admin; payment/recon IDOR |
| Financial closed-loop | Weak | Expenses/reversals/pools/dashboards inconsistent |
| Input validation | Mixed | Stronger on some money paths; expenses/uploads weaker |
| Abuse resistance | Weak | Limited rate limits; capture tokens |
| Observability / ops truth | Weak | Health migration mismatch; in-process queues |
| Documentation honesty | Weak | UI/BRD overclaims vs API |

---

## Scalability & operational risks

1. **In-process queue / HTTP-triggered scheduler** — no Redis/worker durability; cron-like work depends on external HTTP hits; process restart drops work.  
2. **Payment list pagination / caps** — dashboard math that scans capped payment lists will silently undercount at scale.  
3. **Polling-heavy clients** — collectors amplify read load.  
4. **Mail path complexity** — Gmail + Vercel relay is brittle for regulated notifications.  
5. **Migration watermark anomaly** — `27 expected / 26 applied / ok` trains operators to ignore drift.  
6. **Single-region app+API split (Vercel + Railway)** — latency, cookie/CSRF, and partial outage modes need runbooks.

---

## UX / product integrity issues (auditor view)

- Status language historically confused operators (“Under review” vs pending); still requires training that **balanced reconciliations auto-approve**.  
- Expense history was previously invisible to collectors (permission bug) — symptom of UI/API contract drift.  
- Tour/deep-links previously 404’d — suggests release QA does not walk role tours in production.  
- Disbursement awareness for collectors was missing — field staff operate without capital events.  
- Mock-mode behaviour trains false confidence during demos that does not survive API use.

---

## What would be required to claim “enterprise ready”

An external auditor would require, at minimum:

1. Closure of all Critical and High findings above with regression tests that call the **real API**, not mocks.  
2. A single financial ledger invariant suite (disburse, collect, reverse, expense, reconcile) proving dashboard = ledger.  
3. Independent SoD test matrix (Collector / Officer / Approver / Auditor / Super Admin) proving negative cases.  
4. Production pen-test with authenticated roles and concurrency.  
5. Honest health semantics (migration drift must not report `ok`).  
6. Operational runbooks for mail, SMS, push, backups, restore drills — evidenced, not aspirational.

Until then, the correct external statement is:

> **WILMS is an actively evolving operational system with incomplete financial control enforcement. It should not be described as production-certified to investors, regulators, or partner institutions without remediation and independent retest.**

---

## Items not verified (external blockers)

- Authenticated live IDOR reproduction (requires non-demo credentials)  
- Neon concurrency double-post under load  
- Whether invitations remain loginable with `ChangeMe1!` before onboarding  
- Completeness of historical `loan_pool_id` backfill  
- Real SMS/email delivery and bounce handling  
- WAF / CDN rate-limit effectiveness  
- Backup restore drill evidence  

---

## Remediations priority (90-day auditor plan)

| Priority | Action |
|---|---|
| P0 | Enforce admin fee + approval state machine on API; bind collector IDs on payments/reconciliations; revoke auditor review + collector `MANAGE_GROUPS` |
| P0 | Fix reversal↔pool↔progress; expense cash posting; zero-expected reconciliation auto-approve |
| P1 | Pool capital hard stop; holiday/payment-day alignment; real payment edit or removal; invite secret rotation |
| P1 | Dashboard = ledger; fix migration health truthfulness; require idempotency keys on money POSTs |
| P2 | Upload sniffing; capture token entropy; rate limits; durable workers; dependency upgrades |

---

## Sign-off

This report reflects an external black-box/gray-box assessment based on production probes and repository contracts as of the audit date. It intentionally challenges vendor certification language. Findings should be tracked as defects with owners and due dates; retest is required after remediation.
