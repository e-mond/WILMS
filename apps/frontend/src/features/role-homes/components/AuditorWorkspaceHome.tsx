'use client';

import { RoleWorkspaceHero } from '@/components/layout/RoleWorkspaceHero';

export function AuditorWorkspaceHome() {
  return (
    <RoleWorkspaceHero
      title="Audit workspace"
      subtitle="Read-only compliance and operational reporting with a clear trail into the audit log."
      metrics={[
        { label: 'Reports', value: 'Library', href: '/auditor/reports' },
        { label: 'Audit trail', value: 'Event log', href: '/auditor/audit-log' },
        { label: 'Account', value: 'Settings', href: '/auditor/settings' },
      ]}
      actions={[
        {
          href: '/auditor/reports',
          label: 'Open reports',
          description: 'Operational and compliance report catalogue',
        },
        {
          href: '/auditor/audit-log',
          label: 'Inspect audit log',
          description: 'Immutable activity and control evidence',
        },
        {
          href: '/auditor/settings',
          label: 'Auditor preferences',
          description: 'Notification and account controls',
        },
      ]}
    />
  );
}
