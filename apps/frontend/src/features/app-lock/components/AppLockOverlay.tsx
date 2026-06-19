'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import {
  PinEntryPad,
  type PinEntryPadHandle,
} from '@/features/app-lock/components/PinEntryPad';
import { APP_LOCK_MAX_ATTEMPTS } from '@/constants/app-lock';
import { useLogout } from '@/hooks/useLogout';
import { useAuth } from '@/hooks/useAuth';
import { useAppLockStore } from '@/state/appLockStore';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AppLockOverlay() {
  const { user } = useAuth();
  const { logout, isLoggingOut } = useLogout();
  const failedAttempts = useAppLockStore((state) => state.failedAttempts);
  const verifyAndUnlock = useAppLockStore((state) => state.verifyAndUnlock);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pinPadRef = useRef<PinEntryPadHandle>(null);

  const handleComplete = useCallback(
    async (pin: string) => {
      if (!user?.id) {
        return;
      }

      setIsVerifying(true);
      setErrorMessage(null);

      const result = verifyAndUnlock(pin, user.id);

      if (result.success) {
        setIsVerifying(false);
        return;
      }

      if (result.attemptsRemaining <= 0) {
        await logout();
        return;
      }

      setErrorMessage(
        `Incorrect PIN. ${result.attemptsRemaining} attempt${
          result.attemptsRemaining === 1 ? '' : 's'
        } remaining.`,
      );
      setIsVerifying(false);
    },
    [logout, user?.id, verifyAndUnlock],
  );

  const attemptsRemaining = Math.max(APP_LOCK_MAX_ATTEMPTS - failedAttempts, 0);

  useEffect(() => {
    const timer = window.setTimeout(() => pinPadRef.current?.focusInput(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-lock-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-wilms-4 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-sm border border-border bg-card p-wilms-6 shadow-none"
      >
        <div className="mb-wilms-6 text-center">
          <p className="text-display font-bold tracking-wide text-brand-primary">WILMS</p>
          <h1 id="app-lock-title" className="mt-wilms-2 text-heading-2 font-semibold text-text-primary">
            Welcome back
          </h1>
          <p className="mt-wilms-2 text-body text-text-muted">
            {user?.displayName
              ? `${user.displayName}, enter your six-digit PIN to continue.`
              : 'Enter your six-digit PIN to continue.'}
          </p>
        </div>

        {attemptsRemaining <= 2 && attemptsRemaining > 0 ? (
          <Alert title="Security warning" variant="warning" className="mb-wilms-4">
            {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} left before sign-out.
          </Alert>
        ) : null}

        <PinEntryPad
          ref={pinPadRef}
          label="Enter PIN"
          onComplete={(pin) => {
            void handleComplete(pin);
          }}
          errorMessage={errorMessage}
          disabled={isVerifying || isLoggingOut}
          autoFocus
        />

        <div className="mt-wilms-6 border-t border-border pt-wilms-4 text-center">
          <Button
            type="button"
            variant="ghost"
            disabled={isLoggingOut}
            onClick={() => {
              void logout();
            }}
          >
            Sign in again
          </Button>
        </div>
      </div>
    </div>
  );
}
