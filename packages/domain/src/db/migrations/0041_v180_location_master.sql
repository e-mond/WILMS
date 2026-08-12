CREATE TYPE "public"."location_suggestion_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."location_sync_status" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'PARTIAL');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"dataset_version" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "districts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"region_id" uuid NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"dataset_version" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "communities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"district_id" uuid NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"aliases" text[] DEFAULT '{}' NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"dataset_version" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pending_community_suggestions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"district_id" uuid,
	"proposed_name" text NOT NULL,
	"proposed_by_user_id" uuid,
	"status" "location_suggestion_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "location_sync_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dataset_source" text NOT NULL,
	"dataset_version" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"regions_imported" integer DEFAULT 0 NOT NULL,
	"districts_imported" integer DEFAULT 0 NOT NULL,
	"communities_imported" integer DEFAULT 0 NOT NULL,
	"status" "location_sync_status" DEFAULT 'PENDING' NOT NULL,
	"notes" text
);--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN IF NOT EXISTS "region_id" uuid;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN IF NOT EXISTS "district_id" uuid;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN IF NOT EXISTS "community_id" uuid;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "community_id" uuid;--> statement-breakpoint
ALTER TABLE "collectors" ADD COLUMN IF NOT EXISTS "assigned_region_id" uuid;--> statement-breakpoint
ALTER TABLE "collectors" ADD COLUMN IF NOT EXISTS "assigned_district_id" uuid;--> statement-breakpoint
ALTER TABLE "collectors" ADD COLUMN IF NOT EXISTS "assigned_community_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "districts" ADD CONSTRAINT "districts_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communities" ADD CONSTRAINT "communities_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pending_community_suggestions" ADD CONSTRAINT "pending_community_suggestions_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pending_community_suggestions" ADD CONSTRAINT "pending_community_suggestions_proposed_by_user_id_users_id_fk" FOREIGN KEY ("proposed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pending_community_suggestions" ADD CONSTRAINT "pending_community_suggestions_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "regions_code_idx" ON "regions" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "regions_name_idx" ON "regions" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "regions_source_id_idx" ON "regions" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regions_is_active_idx" ON "regions" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "districts_region_name_idx" ON "districts" USING btree ("region_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "districts_source_id_idx" ON "districts" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "districts_region_id_idx" ON "districts" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "districts_is_active_idx" ON "districts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "districts_name_idx" ON "districts" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "communities_district_name_idx" ON "communities" USING btree ("district_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "communities_source_id_idx" ON "communities" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communities_district_id_idx" ON "communities" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communities_is_active_idx" ON "communities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communities_name_idx" ON "communities" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_community_suggestions_district_id_idx" ON "pending_community_suggestions" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_community_suggestions_status_idx" ON "pending_community_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_community_suggestions_name_idx" ON "pending_community_suggestions" USING btree ("proposed_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_sync_log_imported_at_idx" ON "location_sync_log" USING btree ("imported_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_sync_log_status_idx" ON "location_sync_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_sync_log_dataset_idx" ON "location_sync_log" USING btree ("dataset_source","dataset_version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "borrowers_region_id_idx" ON "borrowers" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "borrowers_district_id_idx" ON "borrowers" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "borrowers_community_id_idx" ON "borrowers" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "groups_community_id_idx" ON "groups" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collectors_assigned_region_id_idx" ON "collectors" USING btree ("assigned_region_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collectors_assigned_district_id_idx" ON "collectors" USING btree ("assigned_district_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collectors_assigned_community_id_idx" ON "collectors" USING btree ("assigned_community_id");
