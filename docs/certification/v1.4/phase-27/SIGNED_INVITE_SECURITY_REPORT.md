# Signed Invite Security Report — Phase 27

## Scope

Invitation create, resend, accept, expiry, replay, revocation, logging.

## Prior state

Accept was email-only (`POST /auth/accept-invitation` with `{ email }`). Expiry existed (Phase 26) but the accept link was not bound to a secret.

## Remediation

- Table `invitation_tokens` (migration `0029_v141_invitation_tokens`) stores SHA-256 hashes only
- `issueInvitationToken` / `consumeInvitationToken` with single-use, expiry, revocation
- Email URL includes `token=`; accept route requires token
- Resend revokes prior unused tokens and mints a new one
- Collector onboard sets `invitedAt` and issues a token + email
- Audit actions: issued / consumed / revoked / failed
- Rate limit on accept endpoint

## Verification

- Unit tests: `tests/security/invitation-token.test.ts`
- Template test asserts token in accept URL
- Constant-time compare via `secureCompare`

## Remaining limitations

- Temp invite password still emailed (login credential) — separate from accept token
- Operators must rotate any invite emails already sent under the old email-only flow
