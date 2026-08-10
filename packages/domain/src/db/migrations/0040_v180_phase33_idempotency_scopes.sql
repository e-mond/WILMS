-- Phase 33: extend financial idempotency scopes for expenses and admin fees
ALTER TYPE "public"."idempotency_scope" ADD VALUE IF NOT EXISTS 'EXPENSE_CREATE';--> statement-breakpoint
ALTER TYPE "public"."idempotency_scope" ADD VALUE IF NOT EXISTS 'ADMIN_FEE_RECORD';
