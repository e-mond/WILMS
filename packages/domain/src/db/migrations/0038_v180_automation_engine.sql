-- WILMS v1.8.0 — automation engine foundations
CREATE TABLE IF NOT EXISTS "automation_rules" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "trigger_type" text NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "conditions" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "actions" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "schedule_cron" text,
  "created_by_user_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "automation_rules_category_idx"
  ON "automation_rules" ("category", "enabled");

CREATE TABLE IF NOT EXISTS "automation_runs" (
  "id" uuid PRIMARY KEY NOT NULL,
  "rule_id" uuid REFERENCES "automation_rules"("id"),
  "status" text NOT NULL DEFAULT 'SUCCEEDED',
  "summary" text,
  "details" jsonb,
  "started_at" timestamptz NOT NULL DEFAULT now(),
  "finished_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "automation_runs_started_idx"
  ON "automation_runs" ("started_at" DESC);

CREATE TABLE IF NOT EXISTS "automation_tasks" (
  "id" uuid PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "status" text NOT NULL DEFAULT 'OPEN',
  "assignee_user_id" uuid REFERENCES "users"("id"),
  "related_entity_type" text,
  "related_entity_id" text,
  "due_at" timestamptz,
  "payload" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "automation_tasks_assignee_idx"
  ON "automation_tasks" ("assignee_user_id", "status");
