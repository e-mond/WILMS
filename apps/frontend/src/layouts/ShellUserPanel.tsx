'use client';

import { LogoutButton } from '@/components/auth/LogoutButton';
import { Avatar } from '@/components/data-display';
import { useAuth } from '@/hooks/useAuth';
import { resolvePersonPhotoUrl } from '@/utils/person-photo';
import { cn } from '@/utils/cn';

export interface ShellUserPanelProps {
  className?: string;
  showAvatar?: boolean;
}

export function ShellUserPanel({ className, showAvatar = true }: ShellUserPanelProps) {
  const { user } = useAuth();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showAvatar && user?.displayName ? (
        <Avatar
          label={user.displayName}
          photoUrl={resolvePersonPhotoUrl({ name: user.displayName, id: user.id })}
          size="md"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        {user?.displayName ? (
          <p className="truncate font-medium text-text-primary">{user.displayName}</p>
        ) : null}
      </div>

      <LogoutButton className="w-auto" />
    </div>
  );
}
