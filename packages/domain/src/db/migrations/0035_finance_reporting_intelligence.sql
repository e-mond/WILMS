-- WILMS v1.7.0 — finance reporting & operational intelligence
CREATE TABLE IF NOT EXISTS "export_jobs" (
  "id" uuid PRIMARY KEY NOT NULL,
  "entity_type" text NOT NULL,
  "format" text NOT NULL,
  "status" text NOT NULL DEFAULT 'PENDING',
  "requested_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "filters" jsonb,
  "row_count" integer,
  "file_name" text,
  "error_message" text,
  "expires_at" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "export_jobs_requester_idx"
  ON "export_jobs" ("requested_by_user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "export_jobs_status_idx"
  ON "export_jobs" ("status");

CREATE TABLE IF NOT EXISTS "alert_thresholds" (
  "id" uuid PRIMARY KEY NOT NULL,
  "key" text NOT NULL UNIQUE,
  "label" text NOT NULL,
  "metric" text NOT NULL,
  "operator" text NOT NULL DEFAULT 'gte',
  "threshold_value" double precision NOT NULL,
  "severity" text NOT NULL DEFAULT 'warning',
  "enabled" boolean NOT NULL DEFAULT true,
  "updated_by_user_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "early_warning_events" (
  "id" uuid PRIMARY KEY NOT NULL,
  "threshold_key" text NOT NULL,
  "severity" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "metric_value" double precision,
  "acknowledged_at" timestamptz,
  "acknowledged_by_user_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "early_warning_events_created_idx"
  ON "early_warning_events" ("created_at" DESC);

CREATE TABLE IF NOT EXISTS "operational_incidents" (
  "id" uuid PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "severity" text NOT NULL DEFAULT 'warning',
  "status" text NOT NULL DEFAULT 'OPEN',
  "owner_user_id" uuid REFERENCES "users"("id"),
  "summary" text,
  "resolution" text,
  "opened_at" timestamptz NOT NULL DEFAULT now(),
  "acknowledged_at" timestamptz,
  "resolved_at" timestamptz,
  "created_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "operational_incidents_status_idx"
  ON "operational_incidents" ("status", "opened_at" DESC);

CREATE TABLE IF NOT EXISTS "maintenance_windows" (
  "id" uuid PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "created_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Reporting performance indexes
CREATE INDEX IF NOT EXISTS "payments_recorded_at_idx"
  ON "payments" ("recorded_at");
CREATE INDEX IF NOT EXISTS "payments_status_recorded_idx"
  ON "payments" ("status", "recorded_at");
CREATE INDEX IF NOT EXISTS "loans_external_status_idx"
  ON "loans" ("external_status") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "loan_schedules_due_status_idx"
  ON "loan_schedules" ("due_date", "status");
CREATE INDEX IF NOT EXISTS "expenses_status_created_idx"
  ON "expenses" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "audit_entries_created_idx"
  ON "audit_entries" ("created_at" DESC);
