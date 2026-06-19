'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { AppLockNavbarButton } from '@/components/layout/shell/navbar/AppLockNavbarButton';
import { ConnectionStatusChip } from '@/components/layout/shell/navbar/ConnectionStatusChip';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/state/uiStore';
import { resolveSettingsHref } from '@/utils/settings-route';
import { cn } from '@/utils/cn';
import { MoreVertical, Search, Settings } from 'lucide-react';

export function ShellMobileOverflowMenu() {
  const menuId = useId();
  const { user } = useAuth();
  const settingsHref = resolveSettingsHref(user?.role);
  const openGlobalSearch = useUiStore((state) => state.openGlobalSearch);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <>
      <div ref={containerRef} className="relative shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls={menuId}
          aria-label="More actions"
          className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 text-text-muted hover:text-text-primary"
          onClick={() => setIsOpen((open) => !open)}
        >
          <MoreVertical className="h-5 w-5" aria-hidden="true" />
        </Button>

        {isOpen ? (
          <div
            id={menuId}
            role="menu"
            aria-label="More actions"
            className={cn(
              'absolute right-0 top-full z-50 mt-wilms-2 w-56 rounded-sm border border-border bg-card p-wilms-2 shadow-none',
            )}
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full min-h-[44px] items-center gap-wilms-2 rounded-sm px-wilms-2 py-wilms-2 text-left text-body text-text-primary hover:bg-background"
              onClick={() => {
                openGlobalSearch();
                setIsOpen(false);
              }}
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              Search
            </button>

            <Link
              href={settingsHref}
              role="menuitem"
              className="flex min-h-[44px] items-center gap-wilms-2 rounded-sm px-wilms-2 py-wilms-2 text-body text-text-primary hover:bg-background"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
              Settings
            </Link>

            <div role="menuitem" className="px-wilms-2 py-wilms-1">
              <AppLockNavbarButton />
            </div>

            <div role="menuitem" className="flex min-h-[44px] items-center px-wilms-2 py-wilms-1">
              <ThemeToggle />
            </div>

            <div role="menuitem" className="flex min-h-[44px] items-center px-wilms-2 py-wilms-1">
              <ConnectionStatusChip />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
