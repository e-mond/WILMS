import type { NextFunction, Request, Response } from 'express';
import { AppError, ERROR_CODE } from '../http/errors.js';
import { permissionSetHasAny } from '../infrastructure/permissions/resolve-user-permissions.js';
import type { PermissionId } from '../infrastructure/permissions/matrix.js';
import { getRequestPermissions } from './request-permissions.js';

export function requirePermission(...permissions: PermissionId[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.session) {
      next(new AppError('Authentication required.', ERROR_CODE.UNAUTHORIZED, 401));
      return;
    }

    void getRequestPermissions(req)
      .then((permissionIds) => {
        if (!permissionSetHasAny(permissionIds, permissions)) {
          next(
            new AppError(
              'You do not have permission to perform this action.',
              ERROR_CODE.UNAUTHORIZED,
              403,
            ),
          );
          return;
        }

        next();
      })
      .catch(next);
  };
}
