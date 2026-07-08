import { eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { users } from '../../db/schema/users.js';
import { hashPassword } from '../../lib/password.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { notifyWelcome } from '../../infrastructure/notifications/event-dispatch.js';
import * as userRepo from '../../repositories/user.repository.js';

export interface CompleteOnboardingInput {
  newPassword: string;
  displayName?: string;
  phone?: string;
  branch?: string;
  region?: string;
  zone?: string;
}

export async function completeOnboarding(
  userId: string,
  input: CompleteOnboardingInput,
): Promise<{ status: 'ACTIVE' }> {
  const password = input.newPassword?.trim();
  if (!password || password.length < 8) {
    throw new Error('VALIDATION:Password must be at least 8 characters.');
  }

  if (!isDatabaseEnabled()) {
    return { status: 'ACTIVE' };
  }

  const row = await userRepo.getUserById(userId);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  if (row.status !== 'INVITED') {
    throw new Error('VALIDATION:Account setup is only required for invited users.');
  }

  const db = getDb();
  const passwordHash = await hashPassword(password);

  await db
    .update(users)
    .set({
      passwordHash,
      displayName: input.displayName?.trim() || row.displayName,
      phone: input.phone?.trim() || row.phone,
      branch: input.branch?.trim() || row.branch,
      region: input.region?.trim() || row.region,
      zone: input.zone?.trim() || row.zone,
      status: 'ACTIVE',
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  appendAuditEntry({
    action: 'user.activated',
    actorId: userId,
    targetEntityId: userId,
    targetEntityType: 'user',
    reason: 'Completed invitation onboarding',
  });

  void notifyWelcome({
    email: row.email,
    displayName: input.displayName?.trim() || row.displayName,
    role: row.role,
    userId,
  });

  return { status: 'ACTIVE' };
}
