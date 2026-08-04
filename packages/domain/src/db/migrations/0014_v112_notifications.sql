CREATE TABLE IF NOT EXISTS "message_deliveries" (
  "id" text PRIMARY KEY NOT NULL,
  "event" text NOT NULL,
  "channel" text NOT NULL,
  "recipient" text NOT NULL,
  "provider" text,
  "provider_message_id" text,
  "subject" text,
  "body_preview" text,
  "success" boolean DEFAULT false NOT NULL,
  "failure_reason" text,
  "retry_attempts" integer DEFAULT 0 NOT NULL,
  "borrower_id" text,
  "loan_id" text,
  "user_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_deliveries_event_idx" ON "message_deliveries" USING btree ("event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_deliveries_recipient_idx" ON "message_deliveries" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_deliveries_created_at_idx" ON "message_deliveries" USING btree ("created_at");
