'use client';

import type { ReactNode } from 'react';
import type { PermissionId } from '@/constants/permissions';
import { useOptionalPermissionContext } from '@/components/providers/PermissionProvider';

export interface PermissionGateProps {
  permission?: PermissionId | string;
  permissions?: Array<PermissionId | string>;
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const context = useOptionalPermissionContext();

  if (!context) {
    return <>{children}</>;
  }

  const { hasAnyPermission, hasAllPermissions, isLoading } = context;

  if (isLoading) {
    return null;
  }

  const required = permissions ?? (permission ? [permission] : []);

  if (required.length === 0) {
    return <>{children}</>;
  }

  const allowed = requireAll
    ? hasAllPermissions(required)
    : hasAnyPermission(required);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
