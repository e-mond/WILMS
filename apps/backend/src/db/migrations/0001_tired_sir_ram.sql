CREATE TYPE "public"."idempotency_scope" AS ENUM('LOAN_DISBURSE', 'PAYMENT_POST', 'LOAN_CREATE');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('LOAN_DISBURSEMENT', 'REPAYMENT', 'INTEREST_CHARGE', 'PENALTY_CHARGE');--> statement-breakpoint
CREATE TYPE "public"."loan_external_status" AS ENUM('PENDING_DISBURSEMENT', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF');--> statement-breakpoint
CREATE TYPE "public"."loan_lifecycle_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PENDING_DISBURSEMENT', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'WRITTEN_OFF');--> statement-breakpoint
CREATE TYPE "public"."schedule_week_status" AS ENUM('PENDING', 'PAID', 'MISSED', 'OVERDUE');--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY NOT NULL,
	"borrower_id" uuid NOT NULL,
	"lifecycle_status" "loan_lifecycle_status" NOT NULL,
	"external_status" "loan_external_status" NOT NULL,
	"principal_amount" numeric(15, 2) NOT NULL,
	"approved_amount" numeric(15, 2) NOT NULL,
	"disbursed_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"installment_amount" numeric(15, 2) NOT NULL,
	"loan_balance" numeric(15, 2) NOT NULL,
	"interest_amount" numeric(15, 6) DEFAULT '0' NOT NULL,
	"penalty_amount" numeric(15, 6) DEFAULT '0' NOT NULL,
	"currency_code" text DEFAULT 'GHS' NOT NULL,
	"duration_weeks" integer NOT NULL,
	"payment_day" text NOT NULL,
	"start_date" text NOT NULL,
	"cycle_batch" text NOT NULL,
	"rejection_reason" text,
	"created_by_user_id" uuid,
	"approved_by_user_id" uuid,
	"disbursed_by_user_id" uuid,
	"deleted_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_schedules" (
	"loan_id" uuid NOT NULL,
	"week_number" integer NOT NULL,
	"due_date" text NOT NULL,
	"installment_amount" numeric(15, 2) NOT NULL,
	"currency_code" text DEFAULT 'GHS' NOT NULL,
	"status" "schedule_week_status" DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loan_schedules_loan_id_week_number_pk" PRIMARY KEY("loan_id","week_number")
);
--> statement-breakpoint
CREATE TABLE "loan_disbursements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"loan_id" uuid NOT NULL,
	"disbursed_amount" numeric(15, 2) NOT NULL,
	"currency_code" text DEFAULT 'GHS' NOT NULL,
	"disbursed_by_user_id" uuid NOT NULL,
	"disbursed_at" timestamp with time zone NOT NULL,
	"idempotency_key_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entry_type" "ledger_entry_type" NOT NULL,
	"loan_id" uuid,
	"borrower_id" uuid,
	"payment_id" uuid,
	"amount" numeric(15, 2) NOT NULL,
	"currency_code" text DEFAULT 'GHS' NOT NULL,
	"description" text,
	"actor_user_id" uuid,
	"metadata" jsonb,
	"recorded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"scope" "idempotency_scope" NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_hash" text,
	"response_status" integer,
	"response_body" jsonb,
	"state" text DEFAULT 'IN_PROGRESS' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "schedule_week_number" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "idempotency_key_id" uuid;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_disbursed_by_user_id_users_id_fk" FOREIGN KEY ("disbursed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_schedules" ADD CONSTRAINT "loan_schedules_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_disbursements" ADD CONSTRAINT "loan_disbursements_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_disbursements" ADD CONSTRAINT "loan_disbursements_disbursed_by_user_id_users_id_fk" FOREIGN KEY ("disbursed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_scope_actor_key_idx" ON "idempotency_keys" USING btree ("scope","actor_user_id","idempotency_key");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;