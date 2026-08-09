-- WILMS v1.8.0 — holiday request field enrichment (evidence, notes, community/group, cancel)
ALTER TABLE "holiday_requests" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "holiday_requests" ADD COLUMN IF NOT EXISTS "evidence_url" text;
ALTER TABLE "holiday_requests" ADD COLUMN IF NOT EXISTS "community" text;
ALTER TABLE "holiday_requests" ADD COLUMN IF NOT EXISTS "group_id" text;
ALTER TABLE "holiday_requests" ADD COLUMN IF NOT EXISTS "borrower_id" text;

CREATE INDEX IF NOT EXISTS "holiday_requests_status_date_idx"
  ON "holiday_requests" ("status", "holiday_date");
