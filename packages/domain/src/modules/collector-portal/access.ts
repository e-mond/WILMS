import { AppError, ERROR_CODE } from '../../http/errors.js';
import {
  PERMISSION,
  roleHasPermission,
  USER_ROLE,
  type UserRole,
} from '../../infrastructure/permissions/matrix.js';
import type { SessionUser } from '../../middleware/authenticate.js';

export function assertCollectorAccess(session: SessionUser, collectorId: string): void {
  if (session.role === USER_ROLE.SUPER_ADMIN) {
    return;
  }

  if (roleHasPermission(session.role, PERMISSION.ACCESS_ADMIN_PORTAL)) {
    return;
  }

  if (session.role === USER_ROLE.COLLECTOR && session.userId === collectorId) {
    return;
  }

  throw new AppError('You do not have permission to perform this action.', ERROR_CODE.UNAUTHORIZED, 403);
}
