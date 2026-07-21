-- Phase 30 — idempotent notification delivery records (dedupe across channels).

CREATE TABLE IF NOT EXISTS "notification_delivery_records" (
  "id" uuid PRIMARY KEY NOT NULL,
  "dedupe_key" text NOT NULL,
  "recipient" text NOT NULL,
  "channel" text NOT NULL,
  "notification_type" text NOT NULL,
  "status" text NOT NULL DEFAULT 'PENDING',
  "correlation_id" text,
  "borrower_id" uuid,
  "loan_id" uuid,
  "user_id" uuid,
  "payment_id" uuid,
  "metadata" jsonb,
  "failure_reason" text,
  "retry_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "sent_at" timestamptz,
  "delivered_at" timestamptz,
  "failed_at" timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_delivery_records_dedupe_uq"
  ON "notification_delivery_records" ("dedupe_key", "recipient", "channel");

CREATE INDEX IF NOT EXISTS "notification_delivery_records_type_created_idx"
  ON "notification_delivery_records" ("notification_type", "created_at");

CREATE INDEX IF NOT EXISTS "notification_delivery_records_loan_idx"
  ON "notification_delivery_records" ("loan_id");

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "dedupe_key" text,
  ADD COLUMN IF NOT EXISTS "correlation_id" text;

CREATE INDEX IF NOT EXISTS "notifications_dedupe_key_idx"
  ON "notifications" ("dedupe_key")
  WHERE "dedupe_key" IS NOT NULL;
