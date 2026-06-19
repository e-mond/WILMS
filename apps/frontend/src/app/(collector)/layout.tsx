import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLE } from '@/constants/roles';
import { CollectorShell } from '@/layouts/CollectorShell';

export default function CollectorShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuard requiredRole={USER_ROLE.COLLECTOR}>
      <CollectorShell>{children}</CollectorShell>
    </RoleGuard>
  );
}
