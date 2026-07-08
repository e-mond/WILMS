-- OTP challenges for two-factor login verification
CREATE TABLE IF NOT EXISTS "auth_otp_challenges" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "code_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "auth_otp_challenges_user_id_idx" ON "auth_otp_challenges" ("user_id");
