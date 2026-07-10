'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { PasswordField } from '@/components/forms/PasswordField';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { DEMO_ACCOUNTS } from '@/constants/demo-accounts';
import { isDemoMode } from '@/config/demo';
import { loginSchema, type LoginFormInput } from '@/features/authentication/login.schema';
import { resolveSafeRedirect } from '@/lib/auth/redirect';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { authService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import { useAppLockStore } from '@/state/appLockStore';
import { useLoginPreferencesStore } from '@/state/loginPreferencesStore';
import { ApiError } from '@/types/api';
import { isLoginOtpChallenge } from '@/types/auth';
import { VerifyOtpForm } from '@/features/authentication/components/VerifyOtpForm';
import { WilmsBrandMark } from '@/components/icons/WilmsBrandMark';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const rememberEmail = useLoginPreferencesStore((state) => state.rememberEmail);
  const rememberedEmail = useLoginPreferencesStore((state) => state.rememberedEmail);
  const isPreferencesHydrated = useLoginPreferencesStore((state) => state.isHydrated);
  const setRememberEmail = useLoginPreferencesStore((state) => state.setRememberEmail);
  const setRememberedEmail = useLoginPreferencesStore((state) => state.setRememberedEmail);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [otpChallenge, setOtpChallenge] = useState<{ challengeId: string; message?: string } | null>(
    null,
  );
  const { playLogin } = useNotificationSound();
  const [hasMounted, setHasMounted] = useState(false);
  const isFormReady = hasMounted && isPreferencesHydrated;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const emailValue = watch('email');

  useEffect(() => {
    if (!isPreferencesHydrated) {
      return;
    }

    const invitedEmail = searchParams.get('email')?.trim();

    reset({
      email: invitedEmail || (rememberEmail ? rememberedEmail : ''),
      password: '',
    });
  }, [isPreferencesHydrated, rememberEmail, rememberedEmail, reset, searchParams]);

  useEffect(() => {
    if (!rememberEmail) {
      return;
    }

    const trimmedEmail = emailValue.trim();

    if (trimmedEmail) {
      setRememberedEmail(trimmedEmail);
    }
  }, [emailValue, rememberEmail, setRememberedEmail]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === 'email' || field === 'password') {
          setError(field, { type: 'manual', message: issue.message });
        }
      }

      return;
    }

    try {
      const result = await authService.login(parsed.data);

      if (isLoginOtpChallenge(result)) {
        setOtpChallenge({
          challengeId: result.challengeId,
          message: result.message,
        });
        return;
      }

      setSession(result.user, result.expiresAt);
      playLogin();
      useAppLockStore.getState().unlock();
      useAppLockStore.getState().recordActivity();

      if (rememberEmail) {
        setRememberedEmail(parsed.data.email);
      }

      if (result.mustCompleteOnboarding || result.user.status === 'INVITED') {
        router.replace('/complete-profile');
        return;
      }

      const nextPath = searchParams.get('next');
      router.replace(resolveSafeRedirect(nextPath, result.user.role));
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError('Unable to sign in right now. Please try again.');
    }
  });

  return (
    <div className="w-full overflow-hidden rounded-sm border border-border bg-card/95 shadow-lg backdrop-blur-sm">
      <div className="border-b border-border bg-gradient-to-r from-brand-primary/10 via-brand-primary-light to-executive-gold/10 px-wilms-6 py-wilms-6">
        <div className="flex flex-col items-center gap-wilms-3 text-center">
          <WilmsBrandMark roleLabel="Women&apos;s Interest-Free Loan Management" />
          <p className="text-small text-text-muted">
            Secure access to your role-based workspace
          </p>
        </div>
      </div>

      <div className="p-wilms-6">
        <div className="mb-wilms-6 text-center">
          <h1 className="text-heading-1 font-semibold text-text-primary">Sign in</h1>
          <p className="mt-wilms-2 text-body text-text-muted">
            Enter your credentials to continue to WILMS.
          </p>
        </div>

        {otpChallenge ? (
          <VerifyOtpForm
            challengeId={otpChallenge.challengeId}
            message={otpChallenge.message}
            onBack={() => setOtpChallenge(null)}
          />
        ) : (
        <form
          className="space-y-wilms-4"
          data-login-ready={isFormReady ? 'true' : undefined}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(event);
          }}
        >
          {submitError ? (
            <Alert title="Sign in failed" variant="error">
              {submitError}
            </Alert>
          ) : null}

          <div className="space-y-wilms-2">
            <label htmlFor="login-email" className="text-small font-semibold text-text-primary">
              Email address
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              hasError={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p id="login-email-error" className="text-small text-danger">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <PasswordField
            id="login-password"
            label="Password"
            autoComplete="current-password"
            hasError={Boolean(errors.password)}
            errorId="login-password-error"
            errorMessage={errors.password?.message}
            {...register('password')}
          />

          <p className="text-right text-small">
            <a href="/forgot-password" className="font-semibold text-brand-primary">
              Forgot password?
            </a>
          </p>

          <Checkbox
            id="login-remember-email"
            label="Remember my email on this device"
            checked={rememberEmail}
            onChange={(event) => setRememberEmail(event.target.checked)}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        )}

        {isDemoMode() ? (
          <div className="mt-wilms-6 rounded-sm border border-warning bg-warning-light p-wilms-4">
            <p className="text-small font-semibold text-text-primary">Demo accounts</p>
            <ul className="mt-wilms-2 space-y-wilms-1 text-small text-text-primary">
              {DEMO_ACCOUNTS.map((user) => (
                <li key={user.id}>
                  {user.displayName}: {user.email} / {user.password}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
