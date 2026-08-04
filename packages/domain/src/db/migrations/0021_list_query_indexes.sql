-- v1.3.1 — list query performance indexes (Stage 4 A4-G04)

CREATE INDEX IF NOT EXISTS "payments_borrower_id_idx" ON "payments" ("borrower_id");
CREATE INDEX IF NOT EXISTS "payments_collector_user_id_idx" ON "payments" ("collector_user_id");
CREATE INDEX IF NOT EXISTS "group_members_group_id_idx" ON "group_members" ("group_id");
CREATE INDEX IF NOT EXISTS "group_members_borrower_id_idx" ON "group_members" ("borrower_id");
CREATE INDEX IF NOT EXISTS "borrowers_status_active_idx" ON "borrowers" ("status") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "loans_borrower_id_idx" ON "loans" ("borrower_id");
