import { PERMISSION, USER_ROLE } from '@wilms/shared-rbac';
import type { SessionUser } from '../../middleware/authenticate.js';
import { getBorrower } from '../../db/persistence.js';
import * as groupService from '../groups/service.js';
import { getRequestPermissions } from '../../middleware/request-permissions.js';
import type { Request } from 'express';

async function isBorrowerAssignedToCollector(
  collectorId: string,
  borrowerId: string,
): Promise<boolean> {
  const groups = await groupService.getGroupsForCollector(collectorId);
  return groups.some((group) => group.memberIds.includes(borrowerId));
}

export async function assertBorrowerReadAccess(
  session: SessionUser,
  borrowerId: string,
): Promise<void> {
  if (session.role === USER_ROLE.SUPER_ADMIN || session.role === USER_ROLE.APPROVER) {
    return;
  }

  if (session.role === USER_ROLE.AUDITOR) {
    return;
  }

  if (session.role === USER_ROLE.COLLECTOR) {
    const assigned = await isBorrowerAssignedToCollector(session.userId, borrowerId);
    if (!assigned) {
      throw new Error('FORBIDDEN');
    }
    return;
  }

  if (session.role !== USER_ROLE.REGISTRATION_OFFICER) {
    throw new Error('FORBIDDEN');
  }

  const record = await getBorrower(borrowerId);
  if (!record) {
    throw new Error('NOT_FOUND');
  }

  if (record.registeredByOfficerId !== session.userId) {
    throw new Error('FORBIDDEN');
  }
}

export async function assertBorrowerListAccess(req: Request, status?: string): Promise<void> {
  const permissionIds = await getRequestPermissions(req);

  if (status === 'PENDING') {
    const allowed =
      permissionIds.has(PERMISSION.REVIEW_APPLICATIONS) ||
      permissionIds.has(PERMISSION.ACCESS_ADMIN_PORTAL);
    if (!allowed) {
      throw new Error('FORBIDDEN');
    }
    return;
  }

  const allowed =
    permissionIds.has(PERMISSION.ACCESS_ADMIN_PORTAL) ||
    permissionIds.has(PERMISSION.VIEW_FINANCIAL_REPORTS) ||
    permissionIds.has(PERMISSION.VIEW_REPORTS);
  if (!allowed) {
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
