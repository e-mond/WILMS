import { USER_ROLE } from '@wilms/shared-rbac';
import type { SessionUser } from '../../middleware/authenticate.js';
import { getBorrower } from '../../db/persistence.js';

export async function assertBorrowerReadAccess(
  session: SessionUser,
  borrowerId: string,
): Promise<void> {
  if (session.role === USER_ROLE.SUPER_ADMIN || session.role === USER_ROLE.APPROVER) {
    return;
  }

  if (session.role !== USER_ROLE.REGISTRATION_OFFICER) {
    return;
  }

  const record = await getBorrower(borrowerId);
  if (!record) {
    throw new Error('NOT_FOUND');
  }

  if (record.registeredByOfficerId !== session.userId) {
    throw new Error('FORBIDDEN');
  }
}

export function resolveOfficerIdForList(
  session: SessionUser,
  requestedOfficerId?: string,
): string {
  if (session.role === USER_ROLE.SUPER_ADMIN && requestedOfficerId?.trim()) {
    return requestedOfficerId.trim();
  }

  return session.userId;
}
