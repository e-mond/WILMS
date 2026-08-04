-- Mark-missed collection sheet: idempotency + audit action
ALTER TYPE "public"."idempotency_scope" ADD VALUE IF NOT EXISTS 'PAYMENT_MISSED_MARK';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'PAYMENT_MISSED_MARKED';--> statement-breakpoint
