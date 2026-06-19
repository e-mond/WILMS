import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLE } from '@/constants/roles';
import { ApproverShell } from '@/layouts/ApproverShell';

export default function ApproverShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuard requiredRole={USER_ROLE.APPROVER}>
      <ApproverShell>{children}</ApproverShell>
    </RoleGuard>
  );
}
