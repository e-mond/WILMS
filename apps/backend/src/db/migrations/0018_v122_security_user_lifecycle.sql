-- v1.2.2 — session invalidation + persisted borrower admin fees

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "session_version" integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "borrower_admin_fees" (
  "borrower_id" uuid PRIMARY KEY NOT NULL REFERENCES "borrowers"("id") ON DELETE CASCADE,
  "collector_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "amount_pesewas" integer NOT NULL,
  "transaction_id" text NOT NULL,
  "recorded_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "borrower_admin_fees_collector_idx"
  ON "borrower_admin_fees" ("collector_user_id");
