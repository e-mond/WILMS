CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "location_aliases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"normalised_alias" text NOT NULL,
	"source" text NOT NULL,
	"dataset_version" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "location_data_quality_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"summary" jsonb NOT NULL,
	"notes" text
);--> statement-breakpoint
ALTER TABLE "location_sync_log" ADD COLUMN IF NOT EXISTS "aliases_imported" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "location_aliases_entity_normalised_idx" ON "location_aliases" USING btree ("entity_type","entity_id","normalised_alias");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_aliases_entity_id_idx" ON "location_aliases" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_aliases_normalised_alias_idx" ON "location_aliases" USING btree ("normalised_alias");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_aliases_normalised_alias_trgm_idx" ON "location_aliases" USING gin ("normalised_alias" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_data_quality_runs_ran_at_idx" ON "location_data_quality_runs" USING btree ("ran_at");
