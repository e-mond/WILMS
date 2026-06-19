import type { NextFunction, Request, Response } from 'express';
import { AppError, ERROR_CODE } from '../http/errors.js';
import { roleHasPermission, type PermissionId } from '../infrastructure/permissions/matrix.js';

export function requirePermission(...permissions: PermissionId[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.session) {
      next(new AppError('Authentication required.', ERROR_CODE.UNAUTHORIZED, 401));
      return;
    }

    const allowed = permissions.some((permission) =>
      roleHasPermission(req.session!.role, permission),
    );

    if (!allowed) {
      next(new AppError('You do not have permission to perform this action.', ERROR_CODE.UNAUTHORIZED, 403));
      return;
    }

    next();
  };
}
