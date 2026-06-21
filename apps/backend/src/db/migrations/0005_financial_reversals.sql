-- P14.3B Phase 3C.1 — Payment reversal schema (MVP)
-- Tables: financial_reversals, reversal_history
-- Extends: ledger_entry_type REVERSAL, payment_status REVERSED, idempotency + audit enums

CREATE TYPE "public"."reversal_source_type" AS ENUM('PAYMENT', 'ADJUSTMENT', 'DISBURSEMENT');--> statement-breakpoint

CREATE TYPE "public"."reversal_status" AS ENUM('PENDING', 'EXECUTED', 'REJECTED');--> statement-breakpoint

CREATE TYPE "public"."reversal_history_event" AS ENUM('CREATED', 'EXECUTED', 'REJECTED', 'LEDGER_POSTED');--> statement-breakpoint

ALTER TYPE "public"."ledger_entry_type" ADD VALUE IF NOT EXISTS 'REVERSAL';--> statement-breakpoint

ALTER TYPE "public"."payment_status" ADD VALUE IF NOT EXISTS 'REVERSED';--> statement-breakpoint

ALTER TYPE "public"."idempotency_scope" ADD VALUE IF NOT EXISTS 'REVERSAL_EXECUTE';--> statement-breakpoint

ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'REVERSAL_REQUESTED';--> statement-breakpoint

ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'REVERSAL_EXECUTED';--> statement-breakpoint

ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'REVERSAL_REJECTED';--> statement-breakpoint

ALTER TYPE "public"."audit_target_entity" ADD VALUE IF NOT EXISTS 'REVERSAL';--> statement-breakpoint

CREATE TABLE "financial_reversals" (
  "id" uuid PRIMARY KEY NOT NULL,
  "source_type" "reversal_source_type" NOT NULL,
  "source_id" uuid NOT NULL,
  "loan_id" uuid,
  "borrower_id" uuid NOT NULL,
  "amount_pesewas" integer NOT NULL,
  "reason" text NOT NULL,
  "status" "reversal_status" DEFAULT 'PENDING' NOT NULL,
  "requested_by_user_id" uuid NOT NULL,
  "requested_at" timestamp with time zone NOT NULL,
  "executed_by_user_id" uuid,
  "executed_at" timestamp with time zone,
  "before_balance_pesewas" integer,
  "after_balance_pesewas" integer,
  "delta_pesewas" integer,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "reversal_history" (
  "id" uuid PRIMARY KEY NOT NULL,
  "reversal_id" uuid NOT NULL,
  "event_type" "reversal_history_event" NOT NULL,
  "actor_user_id" uuid NOT NULL,
  "actor_display_name" text NOT NULL,
  "reason" text,
  "before_value_pesewas" integer,
  "after_value_pesewas" integer,
  "delta_pesewas" integer,
  "metadata" jsonb,
  "recorded_at" timestamp with time zone NOT NULL
);--> statement-breakpoint

ALTER TABLE "financial_reversals" ADD CONSTRAINT "financial_reversals_borrower_id_borrowers_id_fk"
  FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "financial_reversals" ADD CONSTRAINT "financial_reversals_loan_id_loans_id_fk"
  FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "financial_reversals" ADD CONSTRAINT "financial_reversals_requested_by_user_id_users_id_fk"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "financial_reversals" ADD CONSTRAINT "financial_reversals_executed_by_user_id_users_id_fk"
  FOREIGN KEY ("executed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "reversal_history" ADD CONSTRAINT "reversal_history_reversal_id_financial_reversals_id_fk"
  FOREIGN KEY ("reversal_id") REFERENCES "public"."financial_reversals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "reversal_history" ADD CONSTRAINT "reversal_history_actor_user_id_users_id_fk"
  FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "reverses_ledger_entry_id" uuid;--> statement-breakpoint

ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "reversal_id" uuid;--> statement-breakpoint

ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_reverses_ledger_entry_id_ledger_entries_id_fk"
  FOREIGN KEY ("reverses_ledger_entry_id") REFERENCES "public"."ledger_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_reversal_id_financial_reversals_id_fk"
  FOREIGN KEY ("reversal_id") REFERENCES "public"."financial_reversals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reversed_at" timestamp with time zone;--> statement-breakpoint

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reversed_by_user_id" uuid;--> statement-breakpoint

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reversal_id" uuid;--> statement-breakpoint

ALTER TABLE "payments" ADD CONSTRAINT "payments_reversed_by_user_id_users_id_fk"
  FOREIGN KEY ("reversed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "payments" ADD CONSTRAINT "payments_reversal_id_financial_reversals_id_fk"
  FOREIGN KEY ("reversal_id") REFERENCES "public"."financial_reversals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE UNIQUE INDEX "financial_reversals_source_executed_uidx"
  ON "financial_reversals" ("source_type", "source_id") WHERE "status" = 'EXECUTED';--> statement-breakpoint

CREATE INDEX "financial_reversals_status_requested_at_idx"
  ON "financial_reversals" ("status", "requested_at");--> statement-breakpoint

CREATE INDEX "financial_reversals_loan_id_idx"
  ON "financial_reversals" ("loan_id");--> statement-breakpoint

CREATE INDEX "reversal_history_reversal_id_idx"
  ON "reversal_history" ("reversal_id");--> statement-breakpoint

CREATE INDEX "ledger_entries_reverses_entry_idx"
  ON "ledger_entries" ("reverses_ledger_entry_id");
