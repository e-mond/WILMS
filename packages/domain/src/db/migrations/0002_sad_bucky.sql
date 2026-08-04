ALTER TYPE "public"."audit_action" ADD VALUE 'LOAN_CREATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'LOAN_APPROVED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'LOAN_REJECTED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'LOAN_DISBURSED';--> statement-breakpoint
ALTER TYPE "public"."audit_target_entity" ADD VALUE 'LOAN';