-- P14.3B Phase 2 — Financial adjustments schema
-- Tables: financial_adjustments, adjustment_reasons, adjustment_history
-- Extends ledger_entry_type and idempotency_scope for adjustment workflow

CREATE TYPE "public"."adjustment_type" AS ENUM(
  'PAYMENT_CORRECTION',
  'DISBURSEMENT_CORRECTION',
  'WRITE_OFF',
  'BALANCE_ADJUSTMENT'
);--> statement-breakpoint

CREATE TYPE "public"."adjustment_status" AS ENUM(
  'PENDING',
  'APPROVED',
  'REJECTED'
);--> statement-breakpoint

CREATE TYPE "public"."adjustment_reason_category" AS ENUM(
  'FEE_CORRECTION',
  'INTEREST_CORRECTION',
  'ADMINISTRATIVE',
  'BALANCE_CORRECTION',
  'MANUAL_CORRECTION'
);--> statement-breakpoint

CREATE TYPE "public"."adjustment_history_event" AS ENUM(
  'CREATED',
  'APPROVED',
  'REJECTED',
  'LEDGER_POSTED'
);--> statement-breakpoint

ALTER TYPE "public"."ledger_entry_type" ADD VALUE IF NOT EXISTS 'ADJUSTMENT';--> statement-breakpoint

ALTER TYPE "public"."idempotency_scope" ADD VALUE IF NOT EXISTS 'ADJUSTMENT_CREATE';--> statement-breakpoint

ALTER TYPE "public"."idempotency_scope" ADD VALUE IF NOT EXISTS 'ADJUSTMENT_APPROVE';--> statement-breakpoint

CREATE TABLE "adjustment_reasons" (
  "id" uuid PRIMARY KEY NOT NULL,
  "code" text NOT NULL,
  "label" text NOT NULL,
  "category" "adjustment_reason_category" NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "adjustment_reasons_code_unique" UNIQUE("code")
);--> statement-breakpoint

CREATE TABLE "financial_adjustments" (
  "id" uuid PRIMARY KEY NOT NULL,
  "type" "adjustment_type" NOT NULL,
  "borrower_id" uuid NOT NULL,
  "borrower_name" text NOT NULL,
  "loan_id" uuid,
  "amount_pesewas" integer NOT NULL,
  "reason" text NOT NULL,
  "reason_code" text,
  "requested_by_user_id" uuid NOT NULL,
  "requested_by_display_name" text NOT NULL,
  "requested_at" timestamp with time zone NOT NULL,
  "status" "adjustment_status" DEFAULT 'PENDING' NOT NULL,
  "reviewed_by_user_id" uuid,
  "reviewed_at" timestamp with time zone,
  "rejection_reason" text,
  "before_balance_pesewas" integer,
  "after_balance_pesewas" integer,
  "delta_pesewas" integer,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "adjustment_history" (
  "id" uuid PRIMARY KEY NOT NULL,
  "adjustment_id" uuid NOT NULL,
  "event_type" "adjustment_history_event" NOT NULL,
  "actor_user_id" uuid NOT NULL,
  "actor_display_name" text NOT NULL,
  "reason" text,
  "before_value_pesewas" integer,
  "after_value_pesewas" integer,
  "delta_pesewas" integer,
  "metadata" jsonb,
  "recorded_at" timestamp with time zone NOT NULL
);--> statement-breakpoint

ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_borrower_id_borrowers_id_fk"
  FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_loan_id_loans_id_fk"
  FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_requested_by_user_id_users_id_fk"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_reviewed_by_user_id_users_id_fk"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_reason_code_adjustment_reasons_code_fk"
  FOREIGN KEY ("reason_code") REFERENCES "public"."adjustment_reasons"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "adjustment_history" ADD CONSTRAINT "adjustment_history_adjustment_id_financial_adjustments_id_fk"
  FOREIGN KEY ("adjustment_id") REFERENCES "public"."financial_adjustments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "adjustment_history" ADD CONSTRAINT "adjustment_history_actor_user_id_users_id_fk"
  FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "financial_adjustments_status_requested_at_idx"
  ON "financial_adjustments" USING btree ("status", "requested_at");--> statement-breakpoint

CREATE INDEX "financial_adjustments_borrower_id_idx"
  ON "financial_adjustments" USING btree ("borrower_id");--> statement-breakpoint

CREATE INDEX "adjustment_history_adjustment_id_idx"
  ON "adjustment_history" USING btree ("adjustment_id");--> statement-breakpoint

CREATE INDEX "loans_external_status_idx"
  ON "loans" USING btree ("external_status");
