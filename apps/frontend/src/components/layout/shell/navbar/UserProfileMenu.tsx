'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Button } from '@/components/ui/Button';
import { ROLE_LABELS, USER_ROLE } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';

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
          'flex shrink-0 items-center transition-colors',
          compact
            ? 'h-10 w-10 min-h-[40px] min-w-[40px] justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5'
            : 'min-h-[40px] gap-2.5 rounded-full px-2 py-1 hover:bg-slate-100/80 dark:hover:bg-white/5 sm:border sm:border-border/60 sm:bg-card/60 sm:pr-3',
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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-brand-primary to-emerald-400 text-xs font-bold text-white shadow-xs"
          aria-hidden="true"
        >
          {initials}
        </div>
        {!compact ? (
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-xs font-semibold text-text-primary">{displayName}</p>
            <p className="truncate text-[10px] font-medium text-text-muted">{resolvedRoleLabel}</p>
          </div>
        ) : null}
        {!compact ? (
          <ChevronDown className="hidden h-3.5 w-3.5 text-text-muted sm:block" aria-hidden="true" />
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
