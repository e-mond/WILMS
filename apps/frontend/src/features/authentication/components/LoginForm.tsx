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
import { authService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import { useAppLockStore } from '@/state/appLockStore';
import { useLoginPreferencesStore } from '@/state/loginPreferencesStore';
import { ApiError } from '@/types/api';

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

    reset({
      email: rememberEmail ? rememberedEmail : '',
      password: '',
    });
  }, [isPreferencesHydrated, rememberEmail, rememberedEmail, reset]);

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
      setSession(result.user, result.expiresAt);
      useAppLockStore.getState().unlock();
      useAppLockStore.getState().recordActivity();

      if (rememberEmail) {
        setRememberedEmail(parsed.data.email);
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
    <div className="w-full max-w-md overflow-hidden rounded-sm border border-border bg-card shadow-none">
      <div className="border-b border-border bg-brand-primary-light px-wilms-6 py-wilms-6 text-center">
        <p className="text-display font-bold tracking-wide text-brand-primary">WILMS</p>
        <p className="mt-wilms-1 text-small font-semibold uppercase tracking-widest text-text-muted">
          Women&apos;s Interest-Free Loan Management
        </p>
      </div>

      <div className="p-wilms-6">
        <div className="mb-wilms-6 text-center">
          <h1 className="text-heading-1 font-semibold text-text-primary">Sign in</h1>
          <p className="mt-wilms-2 text-body text-text-muted">
            Access your role-based workspace for loan operations.
          </p>
        </div>

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
