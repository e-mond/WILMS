import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLE } from '@/constants/roles';
import { AuditorShell } from '@/layouts/AuditorShell';

export default function AuditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuard requiredRole={USER_ROLE.AUDITOR}>
      <AuditorShell>{children}</AuditorShell>
    </RoleGuard>
  );
}
