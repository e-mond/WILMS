-- v1.2.3 — invitation lifecycle timestamps and audit actions

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "invited_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "accepted_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "first_login_at" timestamp with time zone;

UPDATE "users"
SET "invited_at" = COALESCE("invited_at", "created_at")
WHERE "status" = 'INVITED' AND "invited_at" IS NULL;

UPDATE "users"
SET "first_login_at" = COALESCE("first_login_at", "last_login_at")
WHERE "first_login_at" IS NULL AND "last_login_at" IS NOT NULL;

UPDATE "users"
SET "accepted_at" = COALESCE("accepted_at", "first_login_at")
WHERE "status" = 'ACTIVE' AND "accepted_at" IS NULL AND "first_login_at" IS NOT NULL;

ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'USER_INVITED';
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'USER_INVITATION_RESENT';
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'USER_ACTIVATED';
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'USER_SUSPENDED';
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'USER_DELETED';
