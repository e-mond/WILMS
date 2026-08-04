import type { Request } from 'express';
import type { PermissionId } from '../infrastructure/permissions/matrix.js';
import { resolveUserPermissions } from '../infrastructure/permissions/resolve-user-permissions.js';

declare global {
  namespace Express {
    interface Request {
      permissionIds?: Set<PermissionId>;
    }
  }
}

export async function getRequestPermissions(req: Request): Promise<Set<PermissionId>> {
  if (req.permissionIds) {
    return req.permissionIds;
  }

  if (!req.session) {
    return new Set();
  }

  req.permissionIds = await resolveUserPermissions(req.session.userId, req.session.role);
  return req.permissionIds;
}
