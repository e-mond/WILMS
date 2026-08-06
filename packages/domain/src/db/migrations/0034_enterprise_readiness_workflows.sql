-- WILMS v1.6.2 — enterprise readiness workflows
ALTER TYPE "group_status" ADD VALUE IF NOT EXISTS 'DISSOLVED';

CREATE TABLE IF NOT EXISTS "borrower_relocations" (
  "id" uuid PRIMARY KEY NOT NULL,
  "borrower_id" uuid NOT NULL REFERENCES "borrowers"("id"),
  "from_community" text NOT NULL,
  "to_community" text NOT NULL,
  "from_district" text,
  "to_district" text,
  "from_constituency" text,
  "to_constituency" text,
  "from_collector_user_id" uuid REFERENCES "users"("id"),
  "to_collector_user_id" uuid REFERENCES "users"("id"),
  "reason" text NOT NULL,
  "requested_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "borrower_relocations_borrower_idx"
  ON "borrower_relocations" ("borrower_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "loan_schedule_changes" (
  "id" uuid PRIMARY KEY NOT NULL,
  "loan_id" uuid NOT NULL REFERENCES "loans"("id"),
  "borrower_id" uuid NOT NULL REFERENCES "borrowers"("id"),
  "status" text NOT NULL DEFAULT 'PENDING',
  "from_payment_day" text NOT NULL,
  "to_payment_day" text NOT NULL,
  "effective_from" date NOT NULL,
  "reason" text NOT NULL,
  "requested_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "reviewed_by_user_id" uuid REFERENCES "users"("id"),
  "approved_by_user_id" uuid REFERENCES "users"("id"),
  "review_note" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "loan_schedule_changes_loan_idx"
  ON "loan_schedule_changes" ("loan_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "loan_schedule_changes_status_idx"
  ON "loan_schedule_changes" ("status");

CREATE TABLE IF NOT EXISTS "group_member_replacements" (
  "id" uuid PRIMARY KEY NOT NULL,
  "group_id" uuid NOT NULL REFERENCES "groups"("id"),
  "outgoing_borrower_id" uuid NOT NULL REFERENCES "borrowers"("id"),
  "incoming_borrower_id" uuid NOT NULL REFERENCES "borrowers"("id"),
  "status" text NOT NULL DEFAULT 'PENDING',
  "reason" text NOT NULL,
  "requested_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "approved_by_user_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "group_member_replacements_group_idx"
  ON "group_member_replacements" ("group_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "group_dissolutions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "group_id" uuid NOT NULL REFERENCES "groups"("id"),
  "reason" text NOT NULL,
  "outstanding_pesewas" bigint NOT NULL DEFAULT 0,
  "member_count" integer NOT NULL DEFAULT 0,
  "requested_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "auth_login_events" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid REFERENCES "users"("id"),
  "email" text NOT NULL,
  "success" boolean NOT NULL,
  "failure_reason" text,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "auth_login_events_user_idx"
  ON "auth_login_events" ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "auth_login_events_email_idx"
  ON "auth_login_events" ("email", "created_at" DESC);
