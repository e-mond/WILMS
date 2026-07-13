-- v1.3.7-rc2: reconciliation lifecycle tracking
ALTER TYPE "reconciliation_status" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "reconciliation_status" ADD VALUE IF NOT EXISTS 'UNDER_INVESTIGATION';
ALTER TYPE "reconciliation_status" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "reconciliation_status" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "reconciliation_status" ADD VALUE IF NOT EXISTS 'REOPENED';
--> statement-breakpoint
ALTER TABLE "financial_reconciliations" ADD COLUMN IF NOT EXISTS "reviewed_by_user_id" uuid;
ALTER TABLE "financial_reconciliations" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
ALTER TABLE "financial_reconciliations" ADD COLUMN IF NOT EXISTS "resolution_notes" text;
--> statement-breakpoint
ALTER TABLE "financial_reconciliations" ADD CONSTRAINT "financial_reconciliations_reviewed_by_user_id_users_id_fk"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
DROP INDEX IF EXISTS "financial_reconciliations_collector_date_submitted_uidx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "financial_reconciliations_collector_date_uidx"
  ON "financial_reconciliations" ("collector_user_id", "reconciliation_date");
