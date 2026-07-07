-- WILMS v1.2.0 Communication Platform Completion

-- Extended delivery tracking
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "tracking_token" text;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "first_opened_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "open_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "click_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "bounced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "complained_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "message_deliveries_tracking_token_idx" ON "message_deliveries" ("tracking_token") WHERE "tracking_token" IS NOT NULL;--> statement-breakpoint

-- Email tracking events (opens, clicks)
CREATE TABLE IF NOT EXISTS "email_tracking_events" (
  "id" text PRIMARY KEY NOT NULL,
  "delivery_id" text NOT NULL,
  "event_type" text NOT NULL,
  "link_id" text,
  "destination_url" text,
  "user_agent" text,
  "ip_address" text,
  "device_type" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_tracking_events_delivery_idx" ON "email_tracking_events" ("delivery_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_tracking_events_type_idx" ON "email_tracking_events" ("event_type");--> statement-breakpoint

-- Message attachments
CREATE TABLE IF NOT EXISTS "message_attachments" (
  "id" text PRIMARY KEY NOT NULL,
  "message_id" text,
  "upload_id" text NOT NULL,
  "file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "url" text NOT NULL,
  "created_by_user_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_attachments_message_idx" ON "message_attachments" ("message_id");--> statement-breakpoint

-- Push subscriptions
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions" ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_idx" ON "push_subscriptions" ("user_id");--> statement-breakpoint

-- User notification preferences
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id"),
  "email_enabled" boolean DEFAULT true NOT NULL,
  "sms_enabled" boolean DEFAULT true NOT NULL,
  "push_enabled" boolean DEFAULT true NOT NULL,
  "in_app_enabled" boolean DEFAULT true NOT NULL,
  "marketing_enabled" boolean DEFAULT true NOT NULL,
  "announcements_enabled" boolean DEFAULT true NOT NULL,
  "reminders_enabled" boolean DEFAULT true NOT NULL,
  "loan_notifications" boolean DEFAULT true NOT NULL,
  "payment_notifications" boolean DEFAULT true NOT NULL,
  "approval_notifications" boolean DEFAULT true NOT NULL,
  "registration_notifications" boolean DEFAULT true NOT NULL,
  "digest_frequency" text DEFAULT 'INSTANT' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Template versions
CREATE TABLE IF NOT EXISTS "communication_template_versions" (
  "id" text PRIMARY KEY NOT NULL,
  "template_id" text NOT NULL,
  "version_number" integer NOT NULL,
  "subject" text NOT NULL,
  "body_html" text NOT NULL,
  "body_text" text NOT NULL,
  "variables" jsonb,
  "created_by_user_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communication_template_versions_template_idx" ON "communication_template_versions" ("template_id");--> statement-breakpoint

-- Scheduler recurrence
ALTER TABLE "communication_messages" ADD COLUMN IF NOT EXISTS "recurrence_rule" text;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD COLUMN IF NOT EXISTS "recurrence_timezone" text DEFAULT 'Africa/Accra';--> statement-breakpoint
ALTER TABLE "communication_messages" ADD COLUMN IF NOT EXISTS "next_run_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD COLUMN IF NOT EXISTS "last_run_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD COLUMN IF NOT EXISTS "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD COLUMN IF NOT EXISTS "max_retries" integer DEFAULT 3 NOT NULL;--> statement-breakpoint

-- Template variables metadata
ALTER TABLE "communication_templates" ADD COLUMN IF NOT EXISTS "variables" jsonb;--> statement-breakpoint
ALTER TABLE "communication_templates" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint

-- Password reset rate limiting
ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "ip_address" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_hash_idx" ON "password_reset_tokens" ("token_hash");
