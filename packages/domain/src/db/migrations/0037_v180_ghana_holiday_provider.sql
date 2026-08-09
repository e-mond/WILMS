-- WILMS v1.8.0 — Ghana holiday provider metadata on organisation holidays
ALTER TABLE "organization_holidays"
  ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS "enabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "year" integer,
  ADD COLUMN IF NOT EXISTS "external_key" text,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS "organization_holidays_external_key_uidx"
  ON "organization_holidays" ("external_key")
  WHERE "external_key" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "organization_holidays_year_idx"
  ON "organization_holidays" ("year");
