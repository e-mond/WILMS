'use client';

import { RoleWorkspaceHero } from '@/components/layout/RoleWorkspaceHero';

export function OfficerWorkspaceHome() {
  return (
    <RoleWorkspaceHero
      title="Registration workspace"
      subtitle="Capture borrower applications, resume drafts, and keep field registrations moving."
      metrics={[
        { label: 'Focus', value: 'New registrations', href: '/officer/register' },
        { label: 'Queue', value: 'My registrations', href: '/officer/my-registrations' },
        { label: 'Support', value: 'Settings', href: '/officer/settings' },
      ]}
      actions={[
        {
          href: '/officer/register',
          label: 'Start registration',
          description: 'Open the borrower registration wizard',
        },
        {
          href: '/officer/my-registrations',
          label: 'Review my work',
          description: 'Track drafts and submitted applications',
        },
        {
          href: '/officer/settings',
          label: 'Workspace settings',
          description: 'Preferences, notifications, and account',
        },
      ]}
    />
  );
}
