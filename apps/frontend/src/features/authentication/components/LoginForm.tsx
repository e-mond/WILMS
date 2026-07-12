'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { PasswordField } from '@/components/forms/PasswordField';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DEMO_ACCOUNTS } from '@/constants/demo-accounts';
import { isDemoMode } from '@/config/demo';
import { loginSchema, type LoginFormInput } from '@/features/authentication/login.schema';
import { AuthCard } from '@/features/authentication/components/AuthCard';
import { AuthTrustStrip } from '@/features/authentication/components/AuthTrustStrip';
import { resolveSafeRedirect } from '@/lib/auth/redirect';
import { useCapsLockWarning } from '@/hooks/useCapsLockWarning';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { authService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import { useAppLockStore } from '@/state/appLockStore';
import { useLoginPreferencesStore } from '@/state/loginPreferencesStore';
import { ApiError } from '@/types/api';
import { isLoginOtpChallenge } from '@/types/auth';
import { VerifyOtpForm } from '@/features/authentication/components/VerifyOtpForm';

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
  const { capsLockOn, handleKeyEvent, handleBlur } = useCapsLockWarning();
  const [hasMounted, setHasMounted] = useState(false);
  const isFormReady = hasMounted && isPreferencesHydrated;
  const invitedEmail = searchParams.get('email')?.trim() ?? '';

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
    mode: 'onTouched',
  });

  const hasInitializedForm = useRef(false);

  useEffect(() => {
    if (!isPreferencesHydrated || hasInitializedForm.current) {
      return;
    }

    reset({
      email: invitedEmail || (rememberEmail ? rememberedEmail : ''),
      password: '',
    });
    hasInitializedForm.current = true;
  }, [isPreferencesHydrated, invitedEmail, rememberEmail, rememberedEmail, reset]);

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

  if (!isFormReady) {
    return (
      <AuthCard aria-busy="true" aria-label="Loading sign in form">
        <div className="space-y-wilms-4">
          <Skeleton className="mx-auto h-7 w-40" />
          <Skeleton className="mx-auto h-4 w-56" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="space-y-wilms-8">
        <div className="space-y-wilms-3 text-center">
          <h1 className="text-heading-1 font-semibold text-text-primary">Welcome Back</h1>
          <p className="text-body text-text-secondary">Sign in to continue</p>
        </div>

        {invitedEmail ? (
          <Alert title="Invitation ready" variant="info">
            You&apos;ve been invited. Sign in to activate your account.
          </Alert>
        ) : null}

        {otpChallenge ? (
          <VerifyOtpForm
            challengeId={otpChallenge.challengeId}
            message={otpChallenge.message}
            onBack={() => setOtpChallenge(null)}
          />
        ) : (
          <form
            className="space-y-wilms-4"
            data-login-ready="true"
            noValidate
            aria-describedby={submitError ? 'login-submit-error' : undefined}
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(event);
            }}
          >
            {submitError ? (
              <Alert id="login-submit-error" title="Unable to sign in" variant="error">
                {submitError}
              </Alert>
            ) : null}

            <div className="space-y-wilms-2">
              <label htmlFor="login-email" className="text-small font-semibold text-text-primary">
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                autoComplete="username"
                inputMode="email"
                hasError={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                {...register('email')}
              />
              {errors.email ? (
                <p id="login-email-error" role="alert" className="text-small text-danger">
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
              capsLockWarning={capsLockOn}
              onCapsLockKeyEvent={handleKeyEvent}
              onCapsLockBlur={handleBlur}
              labelAction={
                <Link
                  href="/forgot-password"
                  className="text-small font-semibold text-brand-primary hover:underline"
                >
                  Forgot password?
                </Link>
              }
              {...register('password')}
            />

            <Checkbox
              id="login-remember-email"
              label="Remember email"
              checked={rememberEmail}
              onChange={(event) => {
                const checked = event.target.checked;
                setRememberEmail(checked);
                if (checked) {
                  const trimmedEmail = watch('email').trim();
                  if (trimmedEmail) {
                    setRememberedEmail(trimmedEmail);
                  }
                }
              }}
              className="min-h-11"
            />
            <p className="text-small text-text-muted">
              We only store your email on this device, never your password.
            </p>

            <LoadingButton
              type="submit"
              size="lg"
              className="w-full"
              loading={isSubmitting}
              loadingLabel="Signing in…"
            >
              Sign in
            </LoadingButton>

            <p className="text-center text-small text-text-muted">Press Enter to sign in.</p>
          </form>
        )}

        {!otpChallenge ? <AuthTrustStrip /> : null}

        {isDemoMode() ? (
          <div className="rounded-md border border-warning bg-warning-light p-wilms-4">
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
    </AuthCard>
  );
}
