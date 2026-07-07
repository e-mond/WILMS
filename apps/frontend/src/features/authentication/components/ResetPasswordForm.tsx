'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { PasswordField } from '@/components/forms/PasswordField';
import { Button } from '@/components/ui/Button';
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
      <div className="w-full max-w-md rounded-sm border border-border bg-card p-wilms-6">
        <Alert variant="error" title="Invalid reset link">
          This reset link is invalid or has expired.
        </Alert>
        <p className="mt-wilms-4 text-center text-small">
          <Link href="/forgot-password" className="font-semibold text-brand-primary">
            Request a new link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-sm border border-border bg-card p-wilms-6 shadow-sm">
      <h1 className="text-h2 font-semibold text-text-primary">Reset password</h1>
      <p className="mt-wilms-2 text-body text-text-muted">Choose a new password for your account.</p>

      {completed ? (
        <Alert variant="success" title="Password updated" className="mt-wilms-4">
          Redirecting to sign in…
        </Alert>
      ) : (
        <form className="mt-wilms-6 space-y-wilms-4" onSubmit={onSubmit}>
          {submitError ? <Alert variant="error" title="Unable to reset password">{submitError}</Alert> : null}
          <PasswordField
            label="New password"
            autoComplete="new-password"
            hasError={Boolean(errors.newPassword)}
            errorId="reset-new-password-error"
            errorMessage={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'Password is required.',
              minLength: { value: 8, message: 'Password must be at least 8 characters.' },
            })}
          />
          <PasswordField
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </div>
  );
}
