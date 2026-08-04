-- Phase 27 — signed invitation accept tokens (hash-only storage).

CREATE TABLE IF NOT EXISTS "invitation_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "revoked_at" timestamptz,
  "ip_address" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "invitation_tokens_user_id_idx"
  ON "invitation_tokens" ("user_id");

CREATE INDEX IF NOT EXISTS "invitation_tokens_token_hash_idx"
  ON "invitation_tokens" ("token_hash");

CREATE INDEX IF NOT EXISTS "invitation_tokens_expires_at_idx"
  ON "invitation_tokens" ("expires_at");
