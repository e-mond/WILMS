'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert } from '@/components/feedback/Alert';
import { LoadingButton } from '@/components/ui/LoadingButton';
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
  const { playLogin, warm } = useNotificationSound();
  const [code, setCode] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    warm();
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
    <div className="space-y-wilms-4">
      <p className="text-center text-small font-semibold uppercase tracking-wide text-executive-gold">
        Step 2 of 2
      </p>

      <Alert title="Verify it's you" variant="info">
        {message ?? 'Enter the 6-digit code we sent to your email.'}
      </Alert>

      <form
        className="space-y-wilms-4"
        aria-describedby={submitError ? 'otp-submit-error' : undefined}
        onSubmit={(event) => void handleVerify(event)}
      >
        {submitError ? (
          <Alert id="otp-submit-error" title="Verification failed" variant="error">
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
            maxLength={6}
            pattern="[0-9]*"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
          />
        </div>

        <LoadingButton
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingLabel="Verifying…"
          disabled={!code.trim()}
        >
          Verify and continue
        </LoadingButton>

        <LoadingButton type="button" variant="secondary" size="lg" className="w-full" onClick={onBack}>
          Back to sign in
        </LoadingButton>
      </form>
    </div>
  );
}
