-- Hot-query indexes for reconciliation, loan ledger, and pool payment joins.
-- Phase 18 excellence: reduce seq scans under collector-day and loan progress loads.

CREATE INDEX IF NOT EXISTS "payments_collector_date_idx"
  ON "payments" ("collector_user_id", "payment_date");

CREATE INDEX IF NOT EXISTS "ledger_entries_loan_id_idx"
  ON "ledger_entries" ("loan_id");

CREATE INDEX IF NOT EXISTS "payments_loan_id_idx"
  ON "payments" ("loan_id");
