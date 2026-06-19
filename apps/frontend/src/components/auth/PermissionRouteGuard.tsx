'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import type { PermissionId } from '@/constants/permissions';
import { getPortalHomePath } from '@/lib/rbac/permission-matrix';
import { WilmsSplashScreen } from '@/components/feedback/WilmsSplashScreen';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionRouteGuardProps {
  requiredPermissions: PermissionId[];
  children: ReactNode;
}

export function PermissionRouteGuard({
  requiredPermissions,
  children,
}: PermissionRouteGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, isExpired } = useAuth();
  const { hasAnyPermission, isLoading } = usePermissions();

  const isAllowed =
    Boolean(user) && !isLoading && hasAnyPermission(requiredPermissions);

  useEffect(() => {
    if (!isHydrated || isLoading) {
      return;
    }

    if (isExpired) {
      router.replace('/session-expired');
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!isAllowed && user) {
      router.replace(getPortalHomePath(user.role));
    }
  }, [isAllowed, isAuthenticated, isExpired, isHydrated, isLoading, router, user]);

  if (!isHydrated || isLoading) {
    return <WilmsSplashScreen message="Checking access..." />;
  }

  if (isExpired || !isAuthenticated || !isAllowed) {
    return null;
  }

  return children;
}
