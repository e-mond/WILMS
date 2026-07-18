-- v1.4 Phase 25 — platform foundation: transactional outbox + supporting indexes.
-- Idempotency table already exists from earlier migrations.

CREATE TABLE IF NOT EXISTS "domain_outbox" (
  "id" uuid PRIMARY KEY NOT NULL,
  "event_type" text NOT NULL,
  "event_version" integer NOT NULL DEFAULT 1,
  "aggregate_type" text NOT NULL,
  "aggregate_id" text NOT NULL,
  "payload" jsonb NOT NULL,
  "correlation_id" text,
  "status" text NOT NULL DEFAULT 'PENDING',
  "attempts" integer NOT NULL DEFAULT 0,
  "available_at" timestamptz NOT NULL DEFAULT now(),
  "processed_at" timestamptz,
  "last_error" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "domain_outbox_status_available_idx"
  ON "domain_outbox" ("status", "available_at");

CREATE INDEX IF NOT EXISTS "domain_outbox_aggregate_idx"
  ON "domain_outbox" ("aggregate_type", "aggregate_id");

-- Cursor/keyset helpers for high-volume lists (created_at, id).
CREATE INDEX IF NOT EXISTS "borrowers_created_id_idx"
  ON "borrowers" ("created_at", "id");

CREATE INDEX IF NOT EXISTS "payments_created_id_idx"
  ON "payments" ("created_at", "id");

CREATE INDEX IF NOT EXISTS "expenses_created_id_idx"
  ON "expenses" ("created_at", "id");
