# Double-Entry Ledger Migration Roadmap

**Product:** WILMS  
**Date:** 17 July 2026  
**Decision:** The current operational ledger is **insufficient as a statutory General Ledger**. WILMS should **add** a double-entry GL beside the operational loan/payment model — not rip-and-replace field collection in one release.

---

## 1. Verdict on current accounting model

| Capability | Today | Enterprise GL need |
|---|---|---|
| Append-only money events | Partial (`ledger_entries`) | Required |
| Double-entry (debit = credit) | **No** | Required |
| Chart of accounts | **No** | Required |
| Balances derived only from journals | **No** (mutable `loan_balance`, pool aggregates) | Required |
| Period close / trial balance | **No** | Required |
| Compensating reversals | Yes (operational) | Map to reversing journals |
| Collector cash reconciliation | Yes | Keep as sub-ledger control |

**Conclusion:** Keep the **operational sub-ledgers** (loans, payments, pools, expenses). Introduce a **Financial GL bounded context** that posts balanced journals from operational events.

---

## 2. Target architecture

```text
Operational events (existing)
  LoanDisbursed / PaymentRecorded / PaymentReversed / ExpenseRecorded / AdminFeeCollected / PoolReplenished
        │
        ▼
  Posting Rules Engine (versioned)
        │
        ▼
  gl_journal_entries (immutable header)
        │
        ├── gl_journal_lines (debit account, credit account, amount)
        │
        ▼
  Account balances = SUM(lines) GROUP BY account  (materialized nightly + on-demand)
```

### Suggested starter Chart of Accounts (Ghana microfinance ops)

| Code | Account | Normal balance |
|---|---|---|
| 1000 | Cash — Operating | Debit |
| 1100 | Cash — Field / Collector | Debit |
| 1200 | Loan Portfolio — Principal | Debit |
| 1300 | Admin Fee Receivable | Debit |
| 2000 | Loan Capital / Pool Liability (or Equity — org choice) | Credit |
| 3000 | Capital Contributions | Credit |
| 4000 | Admin Fee Income | Credit |
| 5000 | Operating Expenses | Debit |
| 6000 | Suspense / Clearing | Debit/Credit |

Exact equity vs liability treatment for pool capital must be confirmed with the organization’s accountant — do **not** invent GAAP/IFRS policy in code without sign-off.

---

## 3. Posting rule examples

| Operational event | Debit | Credit |
|---|---|---|
| Pool capital injected | 1000 Cash Operating | 3000 Capital |
| Loan disbursed | 1200 Loan Portfolio | 1000 Cash Operating |
| Weekly repayment | 1000 or 1100 Cash | 1200 Loan Portfolio |
| Payment reversal | Reverse prior journal (or opposite lines) | |
| Admin fee collected | 1000 Cash | 4000 Fee Income |
| Expense recorded | 5000 Expense | 1000 Cash |
| Collector recon overage/shortage | Suspense + Cash Field | per policy |

---

## 4. Phased migration

### Phase A — Foundations (v1.4) — **High**

1. Schema: `gl_accounts`, `gl_journal_entries`, `gl_journal_lines`, `gl_periods`
2. Immutability: no UPDATE/DELETE on lines; corrections = reversing + new entries
3. Posting rules table with `effective_from`
4. Dual-write behind feature flag from money services (outbox recommended)
5. Balance verification report: operational KPIs vs GL (not yet authoritative)

**Exit criteria:** Every disbursement/repayment/reversal/expense/admin fee produces a balanced journal in staging.

### Phase B — Read models & controls (v1.5) — **High**

1. Trial balance API + export
2. Period open/close with Super Admin + audit
3. Automatic daily balance job + drift alerts vs `loans.loan_balance` / pools
4. Financial audit export pack (CSV + SHA-256 manifest)
5. Stop treating dashboard JS formulas as books-of-record

**Exit criteria:** Month-end trial balance balances; drift alert = 0 for 30 consecutive days in staging.

### Phase C — Cutover (v2.0) — **High→Critical at cutover**

1. GL becomes system of record for **cash & P&L**
2. Operational loan balances remain for field UX but are **verified projections**
3. Historical backfill: generate opening balances journal + replay from go-live date (or opening balance only if replay cost too high — accountant decision)
4. External accountant sign-off

**Exit criteria:** Independent auditor can reconstruct trial balance from GL exports alone.

---

## 5. What NOT to do

- Do not rewrite payments into an event-sourced CQRS microservice in the same release as GL.
- Do not store signed amounts in operational `ledger_entries` and call it double-entry.
- Do not make expenses hit loan principal “for convenience.”
- Do not enable GL as authoritative without period close and drift monitoring.

---

## 6. Effort & impact summary

| Phase | Effort | Performance | Security | Maintainability |
|---|---|---|---|---|
| A | 25–40 person-days | +1 write path per event | Better segregation of posting | New module |
| B | 20–35 person-days | Batch jobs | Signed exports | Clear close process |
| C | 15–30 person-days + accounting | Backfill heavy once | Audit-ready | Stabilizes long-term |

**Total:** ~60–105 person-days engineering + accountant partnership.

---

## 7. Transaction versioning & automatic reconciliation

| Concern | Approach |
|---|---|
| Versioning | Journal headers immutable; `posting_rule_version` stored on each journal |
| Auto-recon | Nightly: Σ GL cash accounts vs bank/manual input; Σ portfolio vs Σ loan balances |
| EOD balancing | Job marks period day closed when cash + portfolio + suspense rules pass |
| Audit exports | Period-scoped journals + TB + hash manifest |
