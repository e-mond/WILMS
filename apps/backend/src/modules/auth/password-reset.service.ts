import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { env } from '../../config/env.js';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { passwordResetTokens } from '../../db/schema/communication-platform.js';
import { hashPassword } from '../../lib/password.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { notifyPasswordReset, notifyPasswordChanged } from '../../infrastructure/notifications/event-dispatch.js';
import * as userRepo from '../../repositories/user.repository.js';
import { invalidateUserSessions } from './session.service.js';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 5;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function requestPasswordReset(input: {
  email: string;
  ipAddress?: string;
}): Promise<{ ok: true }> {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new Error('VALIDATION:Email is required.');
  }

  if (!isDatabaseEnabled()) {
    return { ok: true };
  }

  const user = await userRepo.findUserByEmail(email);
  const userRow = await userRepo.findAnyUserByEmail(email);

  // Always return success to prevent email enumeration
  if (!user || user.status === 'SUSPENDED') {
    return { ok: true };
  }

  const db = getDb();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        gt(passwordResetTokens.createdAt, oneHourAgo),
      ),
    );

  if (recent.length >= MAX_REQUESTS_PER_HOUR) {
    throw new Error('VALIDATION:Too many reset requests. Please try again later.');
  }

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  await db.insert(passwordResetTokens).values({
    id: uuidv7(),
    userId: user.id,
    tokenHash,
    expiresAt,
    ipAddress: input.ipAddress ?? null,
  });

  const appUrl = env.appUrl ?? 'https://wilms.vercel.app';
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

  try {
    await notifyPasswordReset({
      email: user.email,
      displayName: user.displayName,
      resetUrl,
      userId: user.id,
      phone: userRow?.phone,
    });
  } catch (error) {
    console.error('[password-reset] email failed:', error);
  }

  appendAuditEntry({
    action: 'user.password-reset-requested',
    actorId: user.id,
    targetEntityId: user.id,
    targetEntityType: 'user',
    reason: input.ipAddress ? `ip=${input.ipAddress}` : undefined,
  });

  return { ok: true };
}

export async function resetPasswordWithToken(input: {
  token: string;
  newPassword: string;
  ipAddress?: string;
}): Promise<{ ok: true }> {
  if (!input.newPassword || input.newPassword.length < 8) {
    throw new Error('VALIDATION:Password must be at least 8 characters.');
  }

  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Invalid or expired reset token.');
  }

  const tokenHash = hashToken(input.token.trim());
  const db = getDb();

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) {
    throw new Error('VALIDATION:Invalid or expired reset token.');
  }

  if (!secureCompare(row.tokenHash, tokenHash)) {
    throw new Error('VALIDATION:Invalid or expired reset token.');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await userRepo.updateUserPassword(row.userId, passwordHash);
  await invalidateUserSessions(row.userId);

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));

  appendAuditEntry({
    action: 'user.password-reset-completed',
    actorId: row.userId,
    targetEntityId: row.userId,
    targetEntityType: 'user',
    reason: input.ipAddress ? `ip=${input.ipAddress}` : undefined,
  });

  const user = await userRepo.getUserById(row.userId);
  if (user?.email) {
    try {
      await notifyPasswordChanged({
        email: user.email,
        displayName: user.displayName,
        userId: row.userId,
      });
    } catch (error) {
      console.error('[password-reset] password-changed notification failed:', error);
    }
  }

  return { ok: true };
}
