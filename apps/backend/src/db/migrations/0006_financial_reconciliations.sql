-- P14.3B Phase 4C.1 — Collector cash reconciliation schema (MVP)
-- Tables: financial_reconciliations, reconciliation_history
-- Extends: idempotency_scope RECONCILIATION_SUBMIT
-- Audit enums RECONCILIATION_SUBMITTED / RECONCILIATION already exist in 0000_init

CREATE TYPE "public"."reconciliation_variance_class" AS ENUM('BALANCED', 'SHORTAGE', 'OVERAGE');--> statement-breakpoint

CREATE TYPE "public"."reconciliation_status" AS ENUM('SUBMITTED');--> statement-breakpoint

CREATE TYPE "public"."reconciliation_history_event" AS ENUM('SUBMITTED', 'COMMENT_ADDED');--> statement-breakpoint

ALTER TYPE "public"."idempotency_scope" ADD VALUE IF NOT EXISTS 'RECONCILIATION_SUBMIT';--> statement-breakpoint

CREATE TABLE "financial_reconciliations" (
  "id" uuid PRIMARY KEY NOT NULL,
  "collector_user_id" uuid NOT NULL,
  "reconciliation_date" text NOT NULL,
  "expected_due_pesewas" integer NOT NULL,
  "system_recorded_pesewas" integer NOT NULL,
  "physical_cash_pesewas" integer NOT NULL,
  "primary_variance_pesewas" integer NOT NULL,
  "collection_delta_pesewas" integer NOT NULL,
  "variance_class" "reconciliation_variance_class" NOT NULL,
  "variance_flagged" boolean NOT NULL,
  "threshold_percent" integer NOT NULL,
  "comment" text,
  "status" "reconciliation_status" DEFAULT 'SUBMITTED' NOT NULL,
  "submitted_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "reconciliation_history" (
  "id" uuid PRIMARY KEY NOT NULL,
  "reconciliation_id" uuid NOT NULL,
  "event_type" "reconciliation_history_event" NOT NULL,
  "actor_user_id" uuid NOT NULL,
  "before_snapshot" jsonb,
  "after_snapshot" jsonb NOT NULL,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "financial_reconciliations" ADD CONSTRAINT "financial_reconciliations_collector_user_id_users_id_fk"
  FOREIGN KEY ("collector_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "reconciliation_history" ADD CONSTRAINT "reconciliation_history_reconciliation_id_financial_reconciliations_id_fk"
  FOREIGN KEY ("reconciliation_id") REFERENCES "public"."financial_reconciliations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "reconciliation_history" ADD CONSTRAINT "reconciliation_history_actor_user_id_users_id_fk"
  FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE UNIQUE INDEX "financial_reconciliations_collector_date_submitted_uidx"
  ON "financial_reconciliations" ("collector_user_id", "reconciliation_date")
  WHERE "status" = 'SUBMITTED';--> statement-breakpoint

CREATE INDEX "financial_reconciliations_collector_date_idx"
  ON "financial_reconciliations" ("collector_user_id", "reconciliation_date");--> statement-breakpoint

CREATE INDEX "reconciliation_history_reconciliation_id_idx"
  ON "reconciliation_history" ("reconciliation_id");
