CREATE TYPE "public"."loan_pool_status" AS ENUM('ACTIVE', 'NEAR_FULL', 'LAUNCHING');--> statement-breakpoint
CREATE TYPE "public"."pool_allocation_type" AS ENUM('DISBURSEMENT', 'REPAYMENT', 'REPLENISHMENT', 'ADJUSTMENT');--> statement-breakpoint
CREATE TABLE "loan_pools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"source" text NOT NULL,
	"capital_pesewas" integer NOT NULL,
	"disbursed_pesewas" integer DEFAULT 0 NOT NULL,
	"collected_pesewas" integer DEFAULT 0 NOT NULL,
	"outstanding_pesewas" integer DEFAULT 0 NOT NULL,
	"utilisation_percent" integer DEFAULT 0 NOT NULL,
	"status" "loan_pool_status" DEFAULT 'ACTIVE' NOT NULL,
	"group_count" integer DEFAULT 0 NOT NULL,
	"cycle_label" text NOT NULL,
	"last_replenished_at" timestamp with time zone NOT NULL,
	"repayment_rate_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_memberships" (
	"pool_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_memberships_pool_id_group_id_pk" PRIMARY KEY("pool_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "pool_allocations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pool_id" uuid NOT NULL,
	"allocation_type" "pool_allocation_type" NOT NULL,
	"amount_pesewas" integer NOT NULL,
	"loan_id" uuid,
	"borrower_id" uuid,
	"payment_id" uuid,
	"description" text NOT NULL,
	"actor_user_id" uuid,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pool_memberships" ADD CONSTRAINT "pool_memberships_pool_id_loan_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."loan_pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_memberships" ADD CONSTRAINT "pool_memberships_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_allocations" ADD CONSTRAINT "pool_allocations_pool_id_loan_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."loan_pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_allocations" ADD CONSTRAINT "pool_allocations_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_allocations" ADD CONSTRAINT "pool_allocations_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "loan_pool_id" uuid;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_loan_pool_id_loan_pools_id_fk" FOREIGN KEY ("loan_pool_id") REFERENCES "public"."loan_pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "loan_pools_status_idx" ON "loan_pools" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pool_allocations_pool_id_idx" ON "pool_allocations" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "pool_memberships_pool_id_idx" ON "pool_memberships" USING btree ("pool_id");--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'LOAN_POOL_REPLENISHED';--> statement-breakpoint
ALTER TYPE "public"."audit_target_entity" ADD VALUE 'LOAN_POOL';
