-- WILMS v1.7.5 — collector holiday requests lifecycle
CREATE TABLE IF NOT EXISTS "holiday_requests" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "holiday_date" text NOT NULL,
  "end_date" text,
  "reason" text,
  "scope" text NOT NULL DEFAULT 'NATIONAL',
  "branch" text,
  "status" text NOT NULL DEFAULT 'DRAFT',
  "requested_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "reviewed_by_user_id" uuid REFERENCES "users"("id"),
  "review_note" text,
  "reviewed_at" timestamptz,
  "organization_holiday_id" text REFERENCES "organization_holidays"("id"),
  "applied_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "holiday_requests_requester_idx"
  ON "holiday_requests" ("requested_by_user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "holiday_requests_status_idx"
  ON "holiday_requests" ("status");
CREATE INDEX IF NOT EXISTS "holiday_requests_date_idx"
  ON "holiday_requests" ("holiday_date");
