'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { USER_ROLE } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { useAppLockStore } from '@/state/appLockStore';
import { Lock } from 'lucide-react';

export function AppLockNavbarButton() {
  const { user } = useAuth();
  const isEnabled = useAppLockStore((state) => state.isEnabled);
  const lock = useAppLockStore((state) => state.lock);

  if (!isEnabled) {
    if (user?.role === USER_ROLE.COLLECTOR) {
      return (
        <Link
          href="/collector/security"
          className="text-small font-semibold text-text-muted hover:text-text-primary"
        >
          Set PIN
        </Link>
      );
    }

    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 p-0"
      onClick={lock}
    >
      <Lock className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Lock app now</span>
    </Button>
  );
}
