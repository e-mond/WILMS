import { eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { authOtpChallenges, passwordResetTokens, pushSubscriptions, userNotificationPreferences } from '../../db/schema/communication-platform.js';
import { messageDeliveries } from '../../db/schema/message-deliveries.js';
import { notifications } from '../../db/schema/notifications.js';
import { userPermissionOverrides, userRoles } from '../../db/schema/rbac.js';
import { users } from '../../db/schema/users.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { hashPassword } from '../../lib/password.js';
import { invalidateUserSessions } from '../auth/session.service.js';
import * as userRepo from '../../repositories/user.repository.js';

function unusablePasswordHash(): Promise<string> {
  return hashPassword(createHash('sha256').update(randomBytes(32)).digest('hex'));
}

async function purgeUserAuthArtifacts(userId: string): Promise<void> {
  const db = getDb();

  await db.delete(authOtpChallenges).where(eq(authOtpChallenges.userId, userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  await db.delete(userNotificationPreferences).where(eq(userNotificationPreferences.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(messageDeliveries).where(eq(messageDeliveries.userId, userId));
  await db.delete(userRoles).where(eq(userRoles.userId, userId));
  await db.delete(userPermissionOverrides).where(eq(userPermissionOverrides.userId, userId));
}

export async function permanentlyDeleteUser(userId: string, actorUserId?: string): Promise<void> {
  if (!isDatabaseEnabled()) {
    return;
  }

  const row = await userRepo.getUserById(userId);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  await invalidateUserSessions(userId);
  await purgeUserAuthArtifacts(userId);

  const canHardDelete = row.status === 'INVITED';

  if (canHardDelete) {
    const db = getDb();
    await db.delete(users).where(eq(users.id, userId));

    appendAuditEntry({
      action: 'user.deleted',
      actorId: actorUserId ?? 'system',
      targetEntityId: userId,
      targetEntityType: 'user',
      reason: 'permanent-delete invited account',
    });
    return;
  }

  const db = getDb();
  const anonymizedEmail = `deleted-${userId}@purged.wilms.local`;

  await db
    .update(users)
    .set({
      email: anonymizedEmail,
      passwordHash: await unusablePasswordHash(),
      displayName: 'Deleted User',
      phone: null,
      branch: null,
      region: null,
      zone: null,
      status: 'SUSPENDED',
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  appendAuditEntry({
    action: 'user.deleted',
    actorId: actorUserId ?? 'system',
    targetEntityId: userId,
    targetEntityType: 'user',
    reason: 'permanent-delete anonymized account',
  });
}
