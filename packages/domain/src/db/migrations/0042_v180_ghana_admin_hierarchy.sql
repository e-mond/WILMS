CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sub_district_units" (
	"id" uuid PRIMARY KEY NOT NULL,
	"district_id" uuid NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"unit_type" text NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"dataset_version" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "electoral_areas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"district_id" uuid NOT NULL,
	"sub_district_unit_id" uuid,
	"code" text,
	"name" text NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"dataset_version" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "electoral_area_id" uuid;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "geometry_ref" text;--> statement-breakpoint
ALTER TABLE "pending_community_suggestions" ADD COLUMN IF NOT EXISTS "electoral_area_id" uuid;--> statement-breakpoint
ALTER TABLE "location_sync_log" ADD COLUMN IF NOT EXISTS "checksum" text;--> statement-breakpoint
ALTER TABLE "location_sync_log" ADD COLUMN IF NOT EXISTS "sub_district_units_imported" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "location_sync_log" ADD COLUMN IF NOT EXISTS "electoral_areas_imported" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN IF NOT EXISTS "sub_district_unit_id" uuid;--> statement-breakpoint
ALTER TABLE "borrowers" ADD COLUMN IF NOT EXISTS "electoral_area_id" uuid;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "sub_district_unit_id" uuid;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "electoral_area_id" uuid;--> statement-breakpoint
ALTER TABLE "collectors" ADD COLUMN IF NOT EXISTS "assigned_sub_district_unit_id" uuid;--> statement-breakpoint
ALTER TABLE "collectors" ADD COLUMN IF NOT EXISTS "assigned_electoral_area_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sub_district_units" ADD CONSTRAINT "sub_district_units_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "electoral_areas" ADD CONSTRAINT "electoral_areas_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "electoral_areas" ADD CONSTRAINT "electoral_areas_sub_district_unit_id_sub_district_units_id_fk" FOREIGN KEY ("sub_district_unit_id") REFERENCES "public"."sub_district_units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "communities" ADD CONSTRAINT "communities_electoral_area_id_electoral_areas_id_fk" FOREIGN KEY ("electoral_area_id") REFERENCES "public"."electoral_areas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pending_community_suggestions" ADD CONSTRAINT "pending_community_suggestions_electoral_area_id_electoral_areas_id_fk" FOREIGN KEY ("electoral_area_id") REFERENCES "public"."electoral_areas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sub_district_units_district_name_idx" ON "sub_district_units" USING btree ("district_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sub_district_units_source_id_idx" ON "sub_district_units" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_district_units_district_id_idx" ON "sub_district_units" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_district_units_unit_type_idx" ON "sub_district_units" USING btree ("unit_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_district_units_is_active_idx" ON "sub_district_units" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_district_units_name_idx" ON "sub_district_units" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "electoral_areas_district_name_idx" ON "electoral_areas" USING btree ("district_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "electoral_areas_source_id_idx" ON "electoral_areas" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electoral_areas_district_id_idx" ON "electoral_areas" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electoral_areas_sub_district_unit_id_idx" ON "electoral_areas" USING btree ("sub_district_unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electoral_areas_is_active_idx" ON "electoral_areas" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electoral_areas_name_idx" ON "electoral_areas" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communities_electoral_area_id_idx" ON "communities" USING btree ("electoral_area_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "communities_electoral_area_name_idx" ON "communities" USING btree ("electoral_area_id","name") WHERE "electoral_area_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_community_suggestions_electoral_area_id_idx" ON "pending_community_suggestions" USING btree ("electoral_area_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "borrowers_sub_district_unit_id_idx" ON "borrowers" USING btree ("sub_district_unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "borrowers_electoral_area_id_idx" ON "borrowers" USING btree ("electoral_area_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "groups_sub_district_unit_id_idx" ON "groups" USING btree ("sub_district_unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "groups_electoral_area_id_idx" ON "groups" USING btree ("electoral_area_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collectors_assigned_sub_district_unit_id_idx" ON "collectors" USING btree ("assigned_sub_district_unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collectors_assigned_electoral_area_id_idx" ON "collectors" USING btree ("assigned_electoral_area_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "regions_name_trgm_idx" ON "regions" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "districts_name_trgm_idx" ON "districts" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_district_units_name_trgm_idx" ON "sub_district_units" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "electoral_areas_name_trgm_idx" ON "electoral_areas" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "communities_name_trgm_idx" ON "communities" USING gin ("name" gin_trgm_ops);
