CREATE TABLE IF NOT EXISTS "ghana_regions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "code" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ghana_regions_code_idx" ON "ghana_regions" ("code");

CREATE TABLE IF NOT EXISTS "ghana_districts" (
  "id" uuid PRIMARY KEY NOT NULL,
  "region_id" uuid NOT NULL REFERENCES "ghana_regions"("id"),
  "name" text NOT NULL,
  "type" text NOT NULL,
  "code" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ghana_districts_region_name_idx" ON "ghana_districts" ("region_id", "name");

CREATE TABLE IF NOT EXISTS "ghana_cities" (
  "id" uuid PRIMARY KEY NOT NULL,
  "district_id" uuid NOT NULL REFERENCES "ghana_districts"("id"),
  "name" text NOT NULL,
  "source" text DEFAULT 'official' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ghana_cities_district_name_idx" ON "ghana_cities" ("district_id", "name");
