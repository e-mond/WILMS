'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Button } from '@/components/ui/Button';
import { ROLE_LABELS, USER_ROLE } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

export interface UserProfileMenuProps {
  roleLabel?: string;
  compact?: boolean;
}

export function UserProfileMenu({ roleLabel, compact = false }: UserProfileMenuProps) {
  const menuId = useId();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resolvedRoleLabel = roleLabel ?? (user ? ROLE_LABELS[user.role] : 'User');
  const displayName = user?.displayName ?? resolvedRoleLabel;
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(
          'flex shrink-0 items-center',
          compact
            ? 'h-11 w-11 min-h-[44px] min-w-[44px] justify-center'
            : 'min-h-[44px] min-w-[44px] gap-wilms-2 border-l border-border pl-wilms-3 sm:pl-wilms-4',
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={
          compact ? `Account menu for ${displayName}` : undefined
        }
        onClick={() => setIsOpen((open) => !open)}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-primary bg-brand-primary-light text-small font-bold text-brand-primary sm:h-10 sm:w-10"
          aria-hidden="true"
        >
          {initials}
        </div>
        {!compact ? (
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-body font-semibold text-text-primary">{displayName}</p>
            <p className="truncate text-small text-text-muted">{resolvedRoleLabel}</p>
          </div>
        ) : null}
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label="User menu"
          className={cn(
            'absolute right-0 top-full z-20 mt-wilms-2 w-56 rounded-sm border border-border bg-card p-wilms-3 shadow-none',
          )}
        >
          <div className="mb-wilms-3 border-b border-border pb-wilms-3">
            <p className="text-body font-semibold text-text-primary">{displayName}</p>
            <p className="text-small text-text-muted">{resolvedRoleLabel}</p>
          </div>
          <div className="space-y-wilms-2">
            {user?.role === USER_ROLE.COLLECTOR ? (
              <Link
                href="/collector/settings"
                role="menuitem"
                className="block rounded-sm px-wilms-2 py-wilms-2 text-body text-text-primary hover:bg-background"
                onClick={() => setIsOpen(false)}
              >
                Security & PIN
              </Link>
            ) : null}
            <div role="none">
              <LogoutButton className="w-full" />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
