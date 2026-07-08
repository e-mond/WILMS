import { createHash, randomInt } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { authOtpChallenges } from '../../db/schema/communication-platform.js';
import { getSettings } from '../settings/service.js';
import { notifyLoginOtp } from '../../infrastructure/notifications/event-dispatch.js';
import type { SessionUser } from '../../middleware/authenticate.js';

const OTP_EXPIRY_MS = 10 * 60 * 1000;

function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function generateOtpCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export async function createLoginOtpChallenge(input: {
  userId: string;
  email: string;
  displayName: string;
  phone?: string | null;
  role: string;
}): Promise<{ challengeId: string }> {
  if (!isDatabaseEnabled()) {
    return { challengeId: 'demo-otp-challenge' };
  }

  const settings = await getSettings();
  if (!settings.twoFactorRequired) {
    throw new Error('VALIDATION:Two-factor authentication is not required.');
  }

  const code = generateOtpCode();
  const challengeId = uuidv7();
  const db = getDb();

  await db.insert(authOtpChallenges).values({
    id: challengeId,
    userId: input.userId,
    codeHash: hashOtp(code),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
  });

  await notifyLoginOtp({
    userId: input.userId,
    email: input.email,
    displayName: input.displayName,
    phone: input.phone,
    code,
  });

  return { challengeId };
}

export async function verifyLoginOtpChallenge(input: {
  challengeId: string;
  code: string;
}): Promise<SessionUser | null> {
  if (!isDatabaseEnabled()) {
    if (input.code === '123456') {
      return {
        userId: 'demo-user',
        role: 'SUPER_ADMIN' as SessionUser['role'],
        displayName: 'Demo Admin',
        expiresAt: Date.now() + 60 * 60 * 1000,
      };
    }
    return null;
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(authOtpChallenges)
    .where(
      and(
        eq(authOtpChallenges.id, input.challengeId),
        isNull(authOtpChallenges.usedAt),
        gt(authOtpChallenges.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row || row.codeHash !== hashOtp(input.code.trim())) {
    return null;
  }

  await db
    .update(authOtpChallenges)
    .set({ usedAt: new Date() })
    .where(eq(authOtpChallenges.id, row.id));

  const { getUserById } = await import('../../repositories/user.repository.js');
  const user = await getUserById(row.userId);
  if (!user || user.status === 'SUSPENDED') {
    return null;
  }

  const { env } = await import('../../config/env.js');
  return {
    userId: user.id,
    role: user.role,
    displayName: user.displayName,
    expiresAt: Date.now() + env.sessionDurationMs,
    status: user.status,
  };
}
