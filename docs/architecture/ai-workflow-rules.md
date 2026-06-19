# WILMS — AI Workflow Rules
> Women's Interest-Free Loan Management System | Rules for AI-Assisted Development

---

## 1. Purpose

This file governs how any AI agent or developer assistant must behave when working on the WILMS codebase. It enforces discipline, prevents assumption-driven errors, and ensures the transaction-first, role-based integrity of the system is never violated.

### 1.1 Source of Truth Hierarchy

When documents conflict, follow the resolution order defined in `production-frontend-prompt.md` Section 1 (Source of Truth Hierarchy). Do not duplicate the hierarchy table here — that section is the single source of truth for conflict resolution.

---

## 2. Mandatory Pre-Session Checklist

Before any implementation or architectural decision, read these files **in order**:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-context.md`
4. `context/code-standards.md`
5. `context/ai-workflow-rules.md` ← this file
6. `context/progress-tracker.md`
7. `context/requirements-traceability.md`
8. `context/adrs/` — all ADR files
9. `production-frontend-prompt.md` (project root)

**No exceptions.** If any file is missing or cannot be read, stop and report which file is missing before proceeding.

---

## 3. Implementation Integrity Rules

### Never claim:
- A feature is implemented unless its code physically exists and passes validation
- A test passed unless it was actually executed and output reviewed
- A build succeeded unless `npm run build` was executed and completed without error
- A vulnerability was fixed unless verified via `npm audit`
- A file was created unless it physically exists at the stated path

### When verification cannot be performed, state:
> Not verified. Reason: [explain]

### After generating any context or documentation file:
1. Confirm the exact file path
2. Confirm the file was written to disk — not described, not summarised
3. Confirm the content is complete and non-trivial

If a file cannot be verified as created, state:
> File not created. Reason: [explain]

---

## 4. WILMS-Specific Assumptions — Never Violate

These rules come directly from the BRD and must never be overridden by assumptions or "improvements":

| Rule | Source | Consequence of Violation |
|---|---|---|
| No partial payments | BRD §9.1 | Financial integrity failure; allows underpayment |
| No advance payments | BRD §9.1 | Schedule corruption; breaks weekly cycle tracking |
| Payments clear oldest obligation first | BRD §9.1 | Arrears miscalculation |
| No manual balance entries | BRD §11.1 | Corrupts transaction-first ledger |
| Admin fee must be paid before disbursement | BRD §6 | Loans disbursed without fee = revenue loss |
| Same-day edits only for Collectors | BRD §9.3 | Fraud enablement if extended |
| Adjustments require Super Admin approval | BRD §9.3, §11.2 | Bypasses fraud control |
| Audit log is immutable | BRD §13.2 | Destroys audit trail; regulatory risk |
| GPS + timestamp on every field payment | BRD §13.2 | Removes fraud detection signal |
| Duplicate transaction blocked | BRD §16 | Double-counting of payments |
| Overpayment blocked and flagged | BRD §10.1, §16 | Incorrect balance; requires review |
| Blacklisted borrowers cannot register or guarantee | BRD §4.2 | Fraud re-entry |

---

## 5. No Assumptions Rule

If any requirement is unclear, incomplete, ambiguous, or contradictory:

1. List all ambiguities explicitly
2. Explain the impact of each ambiguity
3. Provide recommended resolution options
4. Explain trade-offs for each option
5. **Request clarification before implementation**

### Known Ambiguities in BRD v1.0 (Resolved or Pending)

| ID | Ambiguity | Impact | Resolution |
|---|---|---|---|
| AMB-001 | Admin fee amount not specified in BRD | Cannot build fee input without knowing if it's configurable or fixed | Assume configurable; Super Admin sets fee in system settings |
| AMB-002 | "Supervisor" used in §9.3 and §12 — not defined as a role; likely = Super Admin | Approval workflow routing unclear | Treat Supervisor = Super Admin throughout |
| AMB-003 | "Offline mode captures data locally" (§16) — no protocol specified for conflict resolution | Sync conflicts possible if same borrower edited online and offline simultaneously | Use last-write-wins with timestamp; flag conflicts for Super Admin review |
| AMB-004 | Collection rate threshold for Supervisor notification not specified in §12 | Cannot set alert threshold | Assume configurable via system settings; default 10% variance |
| AMB-005 | "Similar name matching (fuzzy match)" (§4.2) — algorithm not specified | Over-blocking or under-blocking registrations | Use Levenshtein distance ≤ 2 with manual review prompt (not hard block) |
| AMB-006 | Payment consistency score (§10.4) — formula not defined | Cannot build metric | Define as: (paid weeks ÷ elapsed weeks) × 100; document in code |
| AMB-007 | Borrower-facing self-service portal is Phase 2 — but SMS receipt mentions "remaining balance" | Balance disclosure mechanism must still work in Phase 1 via SMS | Implement SMS balance disclosure only; no self-service portal in Phase 1 |

---

## 6. WILMS-Specific Anti-Patterns

These patterns have been identified as risks specific to WILMS's fraud-prevention and financial integrity requirements:

| Anti-Pattern | Why It's Dangerous in WILMS |
|---|---|
| Computing balances in the component | Bypasses the transaction ledger; can show incorrect outstanding amounts |
| Hiding role-restricted buttons instead of removing them | A Collector could inspect the DOM and trigger Super Admin actions |
| Storing auth token in localStorage | Mobile browser localStorage can be accessed by injected scripts on shared devices |
| Allowing empty/zero payment submission | Collector could record a "payment" that clears a week with no cash collected |
| Trusting client-side date for payment day | Date manipulation could allow payments on wrong days |
| Skipping GPS capture because device denied permission | Removes fraud signal; should show error, not silently proceed |
| Allowing reconciliation form re-submission | Double reconciliation corrupts daily reports |

---

## 7. Implementation Workflow (Per Unit)

For each implementation unit:

1. State what is being built and which BRD requirement it addresses (with BRD section reference)
2. State all dependencies that must exist before this unit
3. Implement only this unit — no speculative code for future units
4. Run unit tests
5. Run integration tests where applicable
6. Run all mandatory validation commands (`lint`, `type-check`, `test`, `build`)
7. Verify WCAG 2.1 AA accessibility for any UI added
8. Review security implications (see banned patterns in `code-standards.md`)
9. Update `context/progress-tracker.md`
10. Update `context/requirements-traceability.md`
11. Present results clearly before proceeding

---

## 8. Rollback Rule

If a new unit causes previously passing tests, lint checks, type checks, or builds to fail:

1. Stop immediately
2. Do not continue to the next unit
3. Identify exactly what regressed and why
4. Fix the regression — do not update tests to match broken behaviour
5. Re-run full validation suite
6. Document in `context/progress-tracker.md`: what broke, what caused it, how it was fixed

---

## 9. Refactoring Trigger Conditions

Stop and refactor before continuing if:
- The same loan/payment validation logic appears in more than one component
- A component imports from more than 3 feature modules (coupling violation)
- A Zod schema is duplicated between registration and approval flows
- Mock data shape diverges from the API type definition (sync them immediately)
- The offline queue store has logic that duplicates payment service logic

---

## 10. Session End Requirements

Before ending any development session:
- `context/progress-tracker.md` must be updated to reflect current state
- Any requirement completed must be marked in `context/requirements-traceability.md`
- Any new architectural decision must have a corresponding ADR in `context/adrs/`
- No broken code may be left uncommitted or undocumented
