'use client';

import { useMemo } from 'react';
import type { ShellNavItem } from '@/constants/navigation';
import { NAV_ITEM_PERMISSIONS } from '@/lib/rbac/permission-matrix';
import { usePermissions } from '@/hooks/usePermissions';

export function useFilteredNavItems(items: ShellNavItem[]): ShellNavItem[] {
  const { hasAnyPermission, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) {
      return items;
    }

    return items.filter((item) => {
      const required = NAV_ITEM_PERMISSIONS[item.href];

      if (!required || required.length === 0) {
        return true;
      }

      return hasAnyPermission(required);
    });
  }, [hasAnyPermission, isLoading, items]);
}
