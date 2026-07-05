ALTER TYPE "public"."audit_action" ADD VALUE 'USER_LOGGED_IN';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'USER_LOGIN_FAILED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'SETTINGS_UPDATED';--> statement-breakpoint
ALTER TABLE "loan_disbursements" ADD COLUMN "display_id" text;--> statement-breakpoint
UPDATE "loan_disbursements"
SET "display_id" = 'DIS-' || to_char("disbursed_at", 'YYYY') || '-' || lpad(
  row_number() OVER (PARTITION BY to_char("disbursed_at", 'YYYY') ORDER BY "disbursed_at", "id")::text,
  6,
  '0'
)
WHERE "display_id" IS NULL;--> statement-breakpoint
ALTER TABLE "loan_disbursements" ALTER COLUMN "display_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "loan_disbursements_display_id_idx" ON "loan_disbursements" USING btree ("display_id");
