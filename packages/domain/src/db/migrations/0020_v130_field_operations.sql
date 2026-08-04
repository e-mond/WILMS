-- v1.3.0 — field operations and advanced lending foundations

CREATE TYPE "repayment_cadence" AS ENUM(
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'BALLOON',
  'GRADUATED'
);

CREATE TYPE "loan_fee_type" AS ENUM(
  'PROCESSING',
  'ADMINISTRATION',
  'LATE',
  'INSURANCE',
  'DOCUMENTATION',
  'CUSTOM'
);

ALTER TABLE "loans"
  ADD COLUMN IF NOT EXISTS "repayment_cadence" "repayment_cadence" NOT NULL DEFAULT 'WEEKLY',
  ADD COLUMN IF NOT EXISTS "grace_days_override" integer;

CREATE TABLE IF NOT EXISTS "organization_holidays" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "holiday_date" text NOT NULL,
  "scope" text NOT NULL DEFAULT 'NATIONAL',
  "branch" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "loan_fee_charges" (
  "id" uuid PRIMARY KEY NOT NULL,
  "loan_id" uuid NOT NULL REFERENCES "loans"("id") ON DELETE CASCADE,
  "fee_type" "loan_fee_type" NOT NULL,
  "amount" numeric(15, 2) NOT NULL,
  "exempted" boolean NOT NULL DEFAULT false,
  "description" text,
  "charged_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_by_user_id" uuid REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "loan_penalty_rules" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "calculation" text NOT NULL DEFAULT 'FLAT',
  "amount" numeric(15, 2),
  "percentage" numeric(8, 4),
  "frequency" text NOT NULL DEFAULT 'WEEKLY',
  "max_amount" numeric(15, 2),
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "loan_fee_charges_loan_idx" ON "loan_fee_charges" ("loan_id");
CREATE INDEX IF NOT EXISTS "organization_holidays_date_idx" ON "organization_holidays" ("holiday_date");
