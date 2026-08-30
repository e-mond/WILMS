ALTER TABLE "system_settings"
  ADD COLUMN IF NOT EXISTS "max_guarantor_guarantees" integer NOT NULL DEFAULT 3;
