CREATE TYPE "public"."approval_decision" AS ENUM('APPROVED', 'REJECTED', 'BLACKLISTED');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('BORROWER_REGISTERED', 'BORROWER_APPROVED', 'BORROWER_REJECTED', 'BORROWER_BLACKLISTED', 'PAYMENT_RECORDED', 'PAYMENT_EDITED', 'OVERPAYMENT_FLAGGED', 'OVERPAYMENT_REVIEWED', 'ADJUSTMENT_REQUESTED', 'ADJUSTMENT_APPROVED', 'ADJUSTMENT_REJECTED', 'RECONCILIATION_SUBMITTED', 'USER_LOGGED_OUT', 'GROUP_FLAGGED', 'GROUP_COLLECTOR_REASSIGNED', 'GROUP_MEMBER_ADDED', 'GROUP_MEMBER_REMOVED', 'GROUP_LEADER_REPLACED', 'GROUP_ADJUSTMENT_RECORDED', 'GROUP_DISPLAY_NAME_UPDATED', 'RISK_FLAG_ESCALATED', 'RISK_FLAG_RESOLVED', 'RISK_FLAG_ASSIGNED', 'RISK_FLAG_RAISED', 'SETTINGS_EXPORTED');--> statement-breakpoint
CREATE TYPE "public"."audit_target_entity" AS ENUM('BORROWER', 'PAYMENT', 'RECONCILIATION', 'ADJUSTMENT', 'OVERPAYMENT_REVIEW', 'USER', 'GROUP', 'RISK_FLAG', 'SETTINGS');--> statement-breakpoint
CREATE TYPE "public"."borrower_gender" AS ENUM('FEMALE', 'MALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."borrower_id_type" AS ENUM('GHANA_CARD', 'VOTER_ID', 'PASSPORT');--> statement-breakpoint
CREATE TYPE "public"."borrower_status" AS ENUM('PENDING', 'APPROVED', 'AT_RISK', 'DEFAULTED', 'REJECTED', 'BLACKLISTED');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('FUEL', 'TRANSPORT', 'AIRTIME', 'FIELD_OPERATIONS', 'OFFICE', 'COMMUNITY_MEETINGS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."group_member_role" AS ENUM('LEADER', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."group_status" AS ENUM('ACTIVE', 'AT_RISK', 'FLAGGED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('SMS', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."notification_event" AS ENUM('REGISTRATION_APPROVED', 'REGISTRATION_REJECTED', 'LOAN_DISBURSED', 'PAYMENT_RECEIVED', 'PAYMENT_REMINDER', 'MISSED_PAYMENT', 'DEFAULTER_STATUS', 'LOAN_COMPLETED', 'GUARANTOR_ALERT', 'SUPERVISOR_ALERT');--> statement-breakpoint
CREATE TYPE "public"."notification_severity" AS ENUM('INFO', 'WARNING', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('CONFIRMED', 'PENDING_SYNC');--> statement-breakpoint
CREATE TYPE "public"."upload_purpose" AS ENUM('profile-photo', 'borrower-photo', 'guarantor-photo', 'document', 'registration-attachment', 'signature', 'thumbprint');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'COLLECTOR', 'REGISTRATION_OFFICER', 'APPROVER', 'AUDITOR');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INVITED', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "collectors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"collector_code" text NOT NULL,
	"assigned_region" text,
	"assigned_district" text,
	"employment_status" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"joined_at" timestamp with time zone,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "collectors_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "collectors_collector_code_unique" UNIQUE("collector_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"staff_id" text,
	"phone" text,
	"branch" text,
	"region" text,
	"zone" text,
	"role" "user_role" NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"profile_image_upload_id" uuid,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" text NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_permission_overrides" (
	"user_id" uuid NOT NULL,
	"permission_id" text NOT NULL,
	"granted" boolean NOT NULL,
	CONSTRAINT "user_permission_overrides_user_id_permission_id_pk" PRIMARY KEY("user_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "borrower_approval_decisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"borrower_id" uuid NOT NULL,
	"decision" "approval_decision" NOT NULL,
	"reason" text,
	"decided_at" timestamp with time zone NOT NULL,
	"approver_user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "borrowers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"id_type" "borrower_id_type" NOT NULL,
	"id_number" text NOT NULL,
	"status" "borrower_status" NOT NULL,
	"has_active_loan" boolean DEFAULT false NOT NULL,
	"group_id" uuid,
	"group_name" text DEFAULT '' NOT NULL,
	"community" text NOT NULL,
	"registered_at" timestamp with time zone NOT NULL,
	"registered_by_user_id" uuid NOT NULL,
	"rejection_reason" text,
	"profile" jsonb NOT NULL,
	"photo_upload_id" uuid,
	"guarantor_photo_upload_id" uuid,
	"id_document_upload_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "group_formation_queue" (
	"community" text NOT NULL,
	"borrower_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "group_formation_queue_community_borrower_id_pk" PRIMARY KEY("community","borrower_id")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" uuid NOT NULL,
	"borrower_id" uuid NOT NULL,
	"role" "group_member_role" DEFAULT 'MEMBER' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "group_members_group_id_borrower_id_pk" PRIMARY KEY("group_id","borrower_id")
);
--> statement-breakpoint
CREATE TABLE "group_sequence_counters" (
	"month_key" text PRIMARY KEY NOT NULL,
	"last_sequence" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"system_id" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"community" text NOT NULL,
	"status" "group_status" DEFAULT 'ACTIVE' NOT NULL,
	"collector_user_id" uuid,
	"leader_borrower_id" uuid,
	"formed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "groups_system_id_unique" UNIQUE("system_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"borrower_id" uuid NOT NULL,
	"collector_user_id" uuid NOT NULL,
	"loan_id" uuid,
	"amount_pesewas" integer NOT NULL,
	"payment_date" text NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"status" "payment_status" DEFAULT 'CONFIRMED' NOT NULL,
	"gps" jsonb,
	"edit_reason" text,
	"edited_at" timestamp with time zone,
	"edited_by_user_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"category" "expense_category" NOT NULL,
	"category_label" text NOT NULL,
	"amount_pesewas" integer NOT NULL,
	"expense_date" text NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"receipt_upload_id" uuid,
	"gps_label" text,
	"recorded_by_user_id" uuid NOT NULL,
	"status" "expense_status" DEFAULT 'PENDING' NOT NULL,
	"review_note" text,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"event" "notification_event" NOT NULL,
	"channel" "notification_channel",
	"severity" "notification_severity" DEFAULT 'INFO' NOT NULL,
	"href" text,
	"borrower_id" uuid,
	"loan_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"purpose" "upload_purpose" NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_key" text NOT NULL,
	"url" text,
	"entity_type" text,
	"entity_id" uuid,
	"owner_user_id" uuid,
	"uploaded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"action" "audit_action" NOT NULL,
	"actor_id" uuid NOT NULL,
	"actor_display_name" text,
	"target_entity_id" text NOT NULL,
	"target_entity_type" "audit_target_entity" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collectors" ADD CONSTRAINT "collectors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrower_approval_decisions" ADD CONSTRAINT "borrower_approval_decisions_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrower_approval_decisions" ADD CONSTRAINT "borrower_approval_decisions_approver_user_id_users_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrowers" ADD CONSTRAINT "borrowers_registered_by_user_id_users_id_fk" FOREIGN KEY ("registered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_formation_queue" ADD CONSTRAINT "group_formation_queue_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_collector_user_id_users_id_fk" FOREIGN KEY ("collector_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_leader_borrower_id_borrowers_id_fk" FOREIGN KEY ("leader_borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_borrower_id_borrowers_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_collector_user_id_users_id_fk" FOREIGN KEY ("collector_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_edited_by_user_id_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;