import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLE } from '@/constants/roles';
import { SuperAdminShell } from '@/layouts/SuperAdminShell';

export default function SuperAdminShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuard requiredRole={USER_ROLE.SUPER_ADMIN}>
      <SuperAdminShell>{children}</SuperAdminShell>
    </RoleGuard>
  );
}
