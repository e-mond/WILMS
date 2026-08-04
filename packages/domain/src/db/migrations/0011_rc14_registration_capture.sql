CREATE TABLE IF NOT EXISTS "registration_drafts" (
  "id" uuid PRIMARY KEY NOT NULL,
  "officer_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "draft_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "last_completed_step" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "registration_drafts_officer_idx"
  ON "registration_drafts" ("officer_user_id");

CREATE TABLE IF NOT EXISTS "photo_capture_sessions" (
  "session_token" text PRIMARY KEY NOT NULL,
  "registration_session_id" text NOT NULL,
  "officer_id" uuid NOT NULL REFERENCES "users"("id"),
  "target" text NOT NULL,
  "status" text NOT NULL DEFAULT 'PENDING',
  "upload_id" uuid,
  "preview_url" text,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "photo_capture_sessions_officer_idx"
  ON "photo_capture_sessions" ("officer_id");
