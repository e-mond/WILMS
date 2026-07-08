import { eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { users } from '../../db/schema/users.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import type { SessionUser } from '../../middleware/authenticate.js';

export async function getUserSessionVersion(userId: string): Promise<number | null> {
  if (!isDatabaseEnabled()) {
    return 1;
  }

  const db = getDb();
  const [row] = await db
    .select({ sessionVersion: users.sessionVersion, deletedAt: users.deletedAt, status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row || row.deletedAt) {
    return null;
  }

  return row.sessionVersion;
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  if (!isDatabaseEnabled()) {
    return;
  }

  const db = getDb();
  const [row] = await db
    .select({ sessionVersion: users.sessionVersion })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    return;
  }

  await db
    .update(users)
    .set({
      sessionVersion: row.sessionVersion + 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function assertSessionActive(session: SessionUser): Promise<void> {
  if (!isDatabaseEnabled()) {
    return;
  }

  const db = getDb();
  const [row] = await db
    .select({
      sessionVersion: users.sessionVersion,
      status: users.status,
      deletedAt: users.deletedAt,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!row || row.deletedAt) {
    throw new AppError('Session has been revoked.', ERROR_CODE.UNAUTHORIZED, 401);
  }

  if (row.status === 'SUSPENDED') {
    throw new AppError('Account is suspended.', ERROR_CODE.UNAUTHORIZED, 401);
  }

  const tokenVersion = session.sessionVersion ?? 1;
  if (row.sessionVersion !== tokenVersion) {
    throw new AppError('Session has been revoked.', ERROR_CODE.UNAUTHORIZED, 401);
  }

  if (row.role !== session.role) {
    throw new AppError('Session has been revoked.', ERROR_CODE.UNAUTHORIZED, 401);
  }

  if (row.status === 'INVITED' && session.status && session.status !== 'INVITED') {
    throw new AppError('Session has been revoked.', ERROR_CODE.UNAUTHORIZED, 401);
  }
}
