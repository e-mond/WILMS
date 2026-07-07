-- WILMS v1.1.3 Communication Center

-- Extend notification enums
ALTER TYPE "notification_channel" ADD VALUE IF NOT EXISTS 'IN_APP';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'USER_INVITED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'LOAN_APPROVED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'LOAN_REJECTED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'BORROWER_BLACKLISTED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'PAYMENT_REVERSAL';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'USER_ACTIVATED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'USER_DISABLED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'ROLE_CHANGED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'GROUP_CREATED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'COLLECTOR_ASSIGNED';--> statement-breakpoint
ALTER TYPE "notification_event" ADD VALUE IF NOT EXISTS 'COMMUNICATION';--> statement-breakpoint

-- Extend message_deliveries for tracking
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'SENT' NOT NULL;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "opened_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "clicked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "bounce_reason" text;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD COLUMN IF NOT EXISTS "communication_message_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_deliveries_status_idx" ON "message_deliveries" USING btree ("status");--> statement-breakpoint

-- Communication templates
CREATE TABLE IF NOT EXISTS "communication_templates" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "subject" text NOT NULL,
  "body_html" text NOT NULL,
  "body_text" text NOT NULL,
  "channels" text[] DEFAULT '{}' NOT NULL,
  "is_system" boolean DEFAULT false NOT NULL,
  "created_by_user_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communication_templates_category_idx" ON "communication_templates" USING btree ("category");--> statement-breakpoint

-- Communication messages (compose, broadcast, scheduled)
CREATE TABLE IF NOT EXISTS "communication_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "subject" text NOT NULL,
  "body_html" text NOT NULL,
  "body_text" text NOT NULL,
  "channels" text[] DEFAULT '{}' NOT NULL,
  "status" text DEFAULT 'DRAFT' NOT NULL,
  "audience_type" text NOT NULL,
  "audience_filter" jsonb,
  "recipient_count" integer DEFAULT 0 NOT NULL,
  "scheduled_at" timestamp with time zone,
  "sent_at" timestamp with time zone,
  "template_id" text,
  "created_by_user_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communication_messages_status_idx" ON "communication_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communication_messages_scheduled_idx" ON "communication_messages" USING btree ("scheduled_at");--> statement-breakpoint

-- Internal messaging extensions
ALTER TABLE "message_threads" ADD COLUMN IF NOT EXISTS "subject" text;--> statement-breakpoint
ALTER TABLE "message_threads" ADD COLUMN IF NOT EXISTS "thread_type" text DEFAULT 'ADMIN_COLLECTOR' NOT NULL;--> statement-breakpoint
ALTER TABLE "message_threads" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "parent_message_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "read_at" timestamp with time zone;--> statement-breakpoint

-- Password reset tokens
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_idx" ON "password_reset_tokens" USING btree ("user_id");
