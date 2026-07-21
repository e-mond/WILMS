import { and, eq, gt, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { invitationTokens } from '../../db/schema/communication-platform.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import {
  INVITATION_EXPIRED_MESSAGE,
  computeInvitationExpiresAt,
} from '../../lib/invitation-expiry.js';
import { generateRawToken, hashToken, secureCompare } from '../../lib/secure-token.js';
import * as userRepo from '../../repositories/user.repository.js';

export const INVITATION_TOKEN_INVALID_MESSAGE =
  'This invitation link is invalid or has already been used. Ask an administrator to resend the invitation.';

interface MemoryInviteToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
}

const memoryTokens: MemoryInviteToken[] = [];

function audit(action: string, actorId: string, reason?: string): void {
  appendAuditEntry({
    action,
    actorId,
    targetEntityId: actorId,
    targetEntityType: 'user',
    reason,
  });
}

/**
 * Mint a one-time invitation accept token. Raw token is returned once for the email URL;
 * only the SHA-256 hash is stored.
 */
export async function issueInvitationToken(input: {
  userId: string;
  expiresAt?: Date;
  ipAddress?: string;
  actorUserId?: string;
}): Promise<{ rawToken: string; expiresAt: Date }> {
  const expiresAt = input.expiresAt ?? computeInvitationExpiresAt();
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const id = uuidv7();

  if (isDatabaseEnabled()) {
    const db = getDb();
    // Revoke outstanding unused tokens for this user (resend / re-invite).
    await db
      .update(invitationTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(invitationTokens.userId, input.userId),
          isNull(invitationTokens.usedAt),
          isNull(invitationTokens.revokedAt),
        ),
      );

    await db.insert(invitationTokens).values({
      id,
      userId: input.userId,
      tokenHash,
      expiresAt,
      ipAddress: input.ipAddress ?? null,
    });
  } else {
    for (const entry of memoryTokens) {
      if (entry.userId === input.userId && !entry.usedAt && !entry.revokedAt) {
        entry.revokedAt = new Date();
      }
    }
    memoryTokens.push({
      id,
      userId: input.userId,
      tokenHash,
      expiresAt,
      usedAt: null,
      revokedAt: null,
    });
  }

  audit('user.invitation_token_issued', input.actorUserId ?? input.userId, `userId=${input.userId}`);

  return { rawToken, expiresAt };
}

export async function revokeInvitationTokensForUser(
  userId: string,
  actorUserId?: string,
): Promise<void> {
  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(invitationTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(invitationTokens.userId, userId),
          isNull(invitationTokens.usedAt),
          isNull(invitationTokens.revokedAt),
        ),
      );
  } else {
    for (const entry of memoryTokens) {
      if (entry.userId === userId && !entry.usedAt && !entry.revokedAt) {
        entry.revokedAt = new Date();
      }
    }
  }

  audit('user.invitation_token_revoked', actorUserId ?? userId, `userId=${userId}`);
}

/**
 * Validate a raw invitation token, mark it used, and return the invited user id.
 * Fail-closed on expiry, reuse, revocation, or unknown hash.
 */
export async function consumeInvitationToken(input: {
  token: string;
  ipAddress?: string;
}): Promise<{ userId: string; email: string; displayName: string; role: string }> {
  const raw = input.token.trim();
  if (!raw || raw.length < 32) {
    audit('user.invitation_token_failed', 'anonymous', 'reason=malformed');
    throw new Error(`VALIDATION:${INVITATION_TOKEN_INVALID_MESSAGE}`);
  }

  const tokenHash = hashToken(raw);
  const now = new Date();

  if (isDatabaseEnabled()) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(invitationTokens)
      .where(
        and(
          eq(invitationTokens.tokenHash, tokenHash),
          isNull(invitationTokens.usedAt),
          isNull(invitationTokens.revokedAt),
          gt(invitationTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!row || !secureCompare(row.tokenHash, tokenHash)) {
      audit('user.invitation_token_failed', 'anonymous', 'reason=invalid_or_expired');
      throw new Error(`VALIDATION:${INVITATION_TOKEN_INVALID_MESSAGE}`);
    }

    const user = await userRepo.getUserById(row.userId);
    if (!user || user.deletedAt || user.status !== 'INVITED') {
      audit('user.invitation_token_failed', row.userId, 'reason=user_not_invited');
      throw new Error(`VALIDATION:${INVITATION_TOKEN_INVALID_MESSAGE}`);
    }

    if (row.expiresAt.getTime() <= now.getTime()) {
      audit('user.invitation_token_failed', row.userId, 'reason=expired');
      throw new Error(`VALIDATION:${INVITATION_EXPIRED_MESSAGE}`);
    }

    const updated = await db
      .update(invitationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(invitationTokens.id, row.id),
          isNull(invitationTokens.usedAt),
          isNull(invitationTokens.revokedAt),
        ),
      )
      .returning();

    if (updated.length === 0) {
      audit('user.invitation_token_failed', row.userId, 'reason=replay');
      throw new Error(`VALIDATION:${INVITATION_TOKEN_INVALID_MESSAGE}`);
    }

    audit('user.invitation_token_consumed', user.id, input.ipAddress ? `ip=${input.ipAddress}` : undefined);

    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  const entry = memoryTokens.find(
    (token) =>
      secureCompare(token.tokenHash, tokenHash) &&
      !token.usedAt &&
      !token.revokedAt &&
      token.expiresAt.getTime() > now.getTime(),
  );

  if (!entry) {
    audit('user.invitation_token_failed', 'anonymous', 'reason=invalid_or_expired');
    throw new Error(`VALIDATION:${INVITATION_TOKEN_INVALID_MESSAGE}`);
  }

  entry.usedAt = now;
  audit('user.invitation_token_consumed', entry.userId, input.ipAddress ? `ip=${input.ipAddress}` : undefined);

  return {
    userId: entry.userId,
    email: 'invited@wilms.local',
    displayName: 'Invited User',
    role: 'COLLECTOR',
  };
}

/** Test helper — clear in-memory tokens between unit tests. */
export function __resetInvitationTokensForTests(): void {
  memoryTokens.length = 0;
}
