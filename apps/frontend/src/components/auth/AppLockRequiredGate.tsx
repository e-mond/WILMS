'use client';

import { usePathname } from 'next/navigation';
import { AppLockSetupPanel } from '@/features/app-lock/components/AppLockSetupPanel';
import { Button } from '@/components/ui/Button';
import { isPublicPath } from '@/lib/auth/routes';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/hooks/useLogout';
import { useAppLockStore } from '@/state/appLockStore';

export function AppLockRequiredGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const { logout, isLoggingOut } = useLogout();
  const isEnabled = useAppLockStore((state) => state.isEnabled);
  const isStoreHydrated = useAppLockStore((state) => state.isHydrated);

  const shouldRequirePin =
    isHydrated &&
    isStoreHydrated &&
    isAuthenticated &&
    !isEnabled &&
    !isPublicPath(pathname);

  if (!shouldRequirePin) {
    return children;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/95 p-wilms-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-wilms-6 shadow-none">
        <div className="mb-wilms-4 text-center">
          <p className="text-display font-bold tracking-wide text-brand-primary">WILMS</p>
          <h1 className="mt-wilms-2 text-heading-2 font-semibold text-text-primary">
            Set up app lock
          </h1>
          <p className="mt-wilms-2 text-body text-text-muted">
            Welcome, {user?.displayName}. Create a six-digit PIN before continuing.
          </p>
        </div>
        <AppLockSetupPanel mandatory />
        <div className="mt-wilms-6 border-t border-border pt-wilms-4 text-center">
          <Button
            type="button"
            variant="ghost"
            disabled={isLoggingOut}
            onClick={() => {
              void logout();
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
