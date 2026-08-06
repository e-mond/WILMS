-- v1.6 Communication Center — audience segments, read receipts, quiet hours.

CREATE TABLE IF NOT EXISTS "communication_audience_segments" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "audience_type" text NOT NULL,
  "audience_filter" jsonb,
  "created_by_user_id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "communication_audience_segments_created_by_idx"
  ON "communication_audience_segments" ("created_by_user_id")
  WHERE "deleted_at" IS NULL;

CREATE TABLE IF NOT EXISTS "communication_message_reads" (
  "id" text PRIMARY KEY NOT NULL,
  "message_id" text NOT NULL,
  "user_id" uuid NOT NULL,
  "read_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "communication_message_reads_message_user_uq" UNIQUE ("message_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "communication_message_reads_message_idx"
  ON "communication_message_reads" ("message_id");

ALTER TABLE "user_notification_preferences"
  ADD COLUMN IF NOT EXISTS "quiet_hours_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "quiet_hours_start" text,
  ADD COLUMN IF NOT EXISTS "quiet_hours_end" text,
  ADD COLUMN IF NOT EXISTS "quiet_hours_timezone" text NOT NULL DEFAULT 'Africa/Accra';
