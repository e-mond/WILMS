ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "organisation_name" text DEFAULT 'WILMS' NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "system_name" text DEFAULT 'Women''s Interest-Free Loan Management System' NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "primary_colour" text DEFAULT '#0F6E56' NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "accent_colour" text DEFAULT '#BA7517' NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "logo_asset" text DEFAULT 'wilms-logo.svg' NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "session_timeout_minutes" integer DEFAULT 30 NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "two_factor_required" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "ip_allowlist_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "failed_login_lockout_attempts" integer DEFAULT 5 NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "password_policy" text DEFAULT 'strong' NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "max_loan_amount_pesewas" integer DEFAULT 500000 NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "default_loan_duration_weeks" integer DEFAULT 12 NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "allow_loan_rollovers" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "late_payment_grace_days" integer DEFAULT 3 NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "sms_provider" text DEFAULT 'smsnotifygh' NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "sms_sender_id" text DEFAULT 'WILMS-GH' NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "missed_payment_sms_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "approval_sms_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "supervisor_escalations_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "immutable_audit_trail" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "audit_export_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "monitoring_alerts_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "gps_verification_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "email_provider_label" text DEFAULT 'SMTP' NOT NULL;
