'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { resolveSafeRedirect } from '@/lib/auth/redirect';
import { authService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import { useAppLockStore } from '@/state/appLockStore';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { ApiError } from '@/types/api';

export interface VerifyOtpFormProps {
  challengeId: string;
  message?: string;
  onBack: () => void;
}

export function VerifyOtpForm({ challengeId, message, onBack }: VerifyOtpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const { playLogin } = useNotificationSound();
  const [code, setCode] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await authService.verifyOtp({ challengeId, code: code.trim() });
      setSession(result.user, result.expiresAt);
      playLogin();
      useAppLockStore.getState().unlock();
      useAppLockStore.getState().recordActivity();

      if (result.mustCompleteOnboarding || result.user.status === 'INVITED') {
        router.replace('/complete-profile');
        return;
      }

      const nextPath = searchParams.get('next');
      router.replace(resolveSafeRedirect(nextPath, result.user.role));
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Unable to verify the code right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-wilms-4" onSubmit={(event) => void handleVerify(event)}>
      <Alert title="Verification required" variant="info">
        {message ?? 'Enter the code sent to your email and phone.'}
      </Alert>

      {submitError ? (
        <Alert title="Verification failed" variant="error">
          {submitError}
        </Alert>
      ) : null}

      <div className="space-y-wilms-2">
        <label htmlFor="login-otp" className="text-small font-semibold text-text-primary">
          Verification code
        </label>
        <Input
          id="login-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="6-digit code"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !code.trim()}>
        {isSubmitting ? 'Verifying...' : 'Verify and continue'}
      </Button>

      <Button type="button" variant="secondary" className="w-full" onClick={onBack}>
        Back to sign in
      </Button>
    </form>
  );
}
