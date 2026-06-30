DO $$ BEGIN
  CREATE TYPE "public"."flag_entity_type" AS ENUM('BORROWER', 'GROUP', 'COLLECTOR', 'LOAN_POOL', 'APPLICATION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."flag_type" AS ENUM('MISSED_PAYMENT', 'DEFAULT', 'FRAUD_SUSPICION', 'DUPLICATE_ID', 'BLACKLISTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."flag_status" AS ENUM('OPEN', 'UNDER_REVIEW', 'CRITICAL', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_flags" (
  "id" uuid PRIMARY KEY NOT NULL,
  "entity_id" uuid NOT NULL,
  "entity_name" text NOT NULL,
  "entity_type" "flag_entity_type" NOT NULL,
  "group_name" text,
  "flag_type" "flag_type" NOT NULL,
  "community" text NOT NULL,
  "officer_name" text DEFAULT '—' NOT NULL,
  "raised_at" timestamp with time zone NOT NULL,
  "arrears_pesewas" integer DEFAULT 0 NOT NULL,
  "status" "flag_status" DEFAULT 'OPEN' NOT NULL,
  "weeks_overdue" integer,
  "active_members" integer,
  "total_members" integer,
  "reason" text,
  "assigned_to_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
  "admin_fee_pesewas" integer DEFAULT 5000 NOT NULL,
  "reconciliation_variance_threshold_percent" integer DEFAULT 5 NOT NULL,
  "sms_notifications_enabled" boolean DEFAULT true NOT NULL,
  "email_notifications_enabled" boolean DEFAULT true NOT NULL,
  "payment_reminder_days_before" integer DEFAULT 1 NOT NULL,
  "min_group_size" integer DEFAULT 5 NOT NULL,
  "max_group_size" integer DEFAULT 15 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "system_settings" ("id")
VALUES ('default')
ON CONFLICT ("id") DO NOTHING;
