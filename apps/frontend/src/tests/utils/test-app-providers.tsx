import type { ReactNode } from 'react';
import { PermissionProvider } from '@/components/providers/PermissionProvider';
import { USER_ROLE, type UserRole } from '@/constants/roles';
import { TestQueryProvider } from '@/tests/utils/test-query-client';

export interface TestAppProvidersProps {
  children: ReactNode;
  role?: UserRole;
  userId?: string;
  displayName?: string;
}

export function TestAppProviders({
  children,
  role = USER_ROLE.SUPER_ADMIN,
  userId = 'user-super-admin',
  displayName = 'Test Admin',
}: TestAppProvidersProps) {
  return (
    <TestQueryProvider>
      <PermissionProvider>
        {/* PermissionProvider reads useAuth; tests should mock useAuth before render. */}
        <span data-testid="test-app-providers" data-role={role} data-user-id={userId} data-display-name={displayName} hidden>
          {displayName}
        </span>
        {children}
      </PermissionProvider>
    </TestQueryProvider>
  );
}
