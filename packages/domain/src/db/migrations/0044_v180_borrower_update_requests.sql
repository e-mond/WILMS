CREATE TABLE IF NOT EXISTS "borrower_update_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"borrower_id" uuid NOT NULL,
	"field" text NOT NULL,
	"before_value" text DEFAULT '' NOT NULL,
	"after_value" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'SUBMITTED' NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"reviewed_by_user_id" uuid,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "borrower_update_requests" ADD CONSTRAINT "borrower_update_requests_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "borrower_update_requests" ADD CONSTRAINT "borrower_update_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "borrower_update_requests" ADD CONSTRAINT "borrower_update_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "borrower_update_requests_borrower_id_idx" ON "borrower_update_requests" USING btree ("borrower_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "borrower_update_requests_status_idx" ON "borrower_update_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "borrower_update_requests_requested_by_idx" ON "borrower_update_requests" USING btree ("requested_by_user_id");
