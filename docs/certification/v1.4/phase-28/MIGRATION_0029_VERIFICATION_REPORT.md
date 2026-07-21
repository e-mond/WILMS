# Phase 28D — Migration 0029 Verification Report

**Date**: 2026-07-21  
**Version**: v1.4.2

## Migration

**File**: `apps/backend/src/db/migrations/0029_v141_invitation_tokens.sql`

## Code Verification (Without Live Database)

### Journal Entry

```json
{
  "idx": 29,
  "version": "0029_v141_invitation_tokens",
  "when": 1752000000000,
  "tag": "0029_v141_invitation_tokens",
  "breakpoints": true
}
```

Journal entry exists and is the last entry in `meta/_journal.json`. ✓

### Migration SQL

```sql
CREATE TABLE IF NOT EXISTS invitation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitation_tokens_user_id ON invitation_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_tokens_hash ON invitation_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_expires_at ON invitation_tokens(expires_at);
```

### Verification Against Requirements

| Requirement | Verified |
|-------------|----------|
| Migration file exists | ✓ |
| Journal entry exists | ✓ |
| Table name: `invitation_tokens` | ✓ |
| `id` UUID PK | ✓ |
| `user_id` FK → `users(id)` ON DELETE CASCADE | ✓ |
| `token_hash TEXT` — hash stored, not plaintext | ✓ |
| `expires_at` — expiry enforced | ✓ |
| `used_at` — single-use tracking | ✓ |
| `revoked_at` — revocation tracking | ✓ |
| Index on `user_id` | ✓ |
| Unique index on `token_hash` | ✓ |
| Index on `expires_at` | ✓ |
| `CREATE TABLE IF NOT EXISTS` — idempotent | ✓ |
| `CREATE INDEX IF NOT EXISTS` — idempotent | ✓ |

### Token Security Properties (Service Layer)

Verified in `apps/backend/src/modules/auth/invitation-token.service.ts`:

- Raw token generated via `randomBytes(32).toString('hex')` — 256 bits of entropy
- Only SHA-256 hash stored in database — plaintext never persisted
- Consumption: sets `used_at`; subsequent requests with same token return `TOKEN_USED` error
- Revocation: `resendInvitation` sets `revoked_at` on all previous tokens before issuing new one
- Expiry: tokens valid for 7 days (`invitedAt + 7 days`); expired tokens fail-closed
- Rate limit: `invitationAbuseLimiter` applied to `POST /auth/accept-invitation`

### Old Invitation Handling

Users invited before migration 0029 have no `invitation_tokens` row. The `accept-invitation` route returns a clear error ("This invitation link is missing a secure token. Ask an administrator to resend it.") guiding the user to request a resend. No silent failure.

### Operational Verification

**BLOCKED** — no `DATABASE_URL` available in this environment.

To verify operationally, run:

```bash
DATABASE_URL=<staging-db-url> npm run migrate
psql $DATABASE_URL -c "\d invitation_tokens"
psql $DATABASE_URL -c "\di idx_invitation_tokens*"
```

Expected: table and all three indexes present.
