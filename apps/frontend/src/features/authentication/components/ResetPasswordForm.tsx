'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { PasswordField } from '@/components/forms/PasswordField';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { AuthBackLink } from '@/features/authentication/components/AuthBackLink';
import { AuthCard } from '@/features/authentication/components/AuthCard';
import { AuthTrustStrip } from '@/features/authentication/components/AuthTrustStrip';
import { authService } from '@/services';
import { ApiError } from '@/types/api';

interface ResetPasswordInput {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setSubmitError('Reset token is missing or invalid.');
      return;
    }

    setSubmitError(null);
    try {
      await authService.resetPassword(token, values.newPassword);
      setCompleted(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Unable to reset password. Please try again.';
      setSubmitError(message);
    }
  });

  if (!token) {
    return (
      <AuthCard className="rounded-xl">
        <div className="space-y-wilms-4">
          <Alert variant="error" title="Invalid reset link">
            This reset link is invalid or has expired.
          </Alert>
          <p className="text-center text-small">
            <Link href="/forgot-password" className="font-semibold text-brand-primary hover:underline">
              Request a new link
            </Link>
          </p>
          <AuthBackLink />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard className="rounded-xl">
      <div className="space-y-wilms-8">
        <div className="space-y-wilms-3 text-center">
          <h1 className="text-heading-1 font-semibold text-text-primary">Reset password</h1>
          <p className="text-body text-text-secondary">Choose a new password for your account.</p>
        </div>

        {completed ? (
          <Alert variant="success" title="Password updated">
            Redirecting to sign in…
          </Alert>
        ) : (
          <form className="space-y-wilms-4" noValidate onSubmit={(event) => void onSubmit(event)}>
            {submitError ? (
              <Alert title="Unable to reset password" variant="error">
                {submitError}
              </Alert>
            ) : null}
            <PasswordField
              id="reset-new-password"
              label="New password"
              autoComplete="new-password"
              hasError={Boolean(errors.newPassword)}
              errorId="reset-new-password-error"
              errorMessage={errors.newPassword?.message}
              {...register('newPassword', {
                required: 'Password is required.',
                minLength: { value: 10, message: 'Password must be at least 10 characters.' },
              })}
            />
            <PasswordField
              id="reset-confirm-password"
              label="Confirm password"
              autoComplete="new-password"
              hasError={Boolean(errors.confirmPassword)}
              errorId="reset-confirm-password-error"
              errorMessage={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password.',
                validate: (value) => value === newPassword || 'Passwords do not match.',
              })}
            />
            <LoadingButton
              type="submit"
              size="lg"
              className="w-full"
              loading={isSubmitting}
              loadingLabel="Updating…"
            >
              Update password
            </LoadingButton>
          </form>
        )}

        <AuthBackLink />
        <AuthTrustStrip message="Secure password reset. Your account information remains protected." />
      </div>
    </AuthCard>
  );
}
