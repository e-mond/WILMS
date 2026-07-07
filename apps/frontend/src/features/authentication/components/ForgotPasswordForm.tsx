'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services';
import { ApiError } from '@/types/api';

interface ForgotPasswordInput {
  email: string;
}

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ defaultValues: { email: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await authService.requestPasswordReset(values.email.trim());
      setSubmitted(true);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Unable to send reset email. Please try again.';
      setSubmitError(message);
    }
  });

  return (
    <div className="w-full max-w-md rounded-sm border border-border bg-card p-wilms-6 shadow-sm">
      <h1 className="text-h2 font-semibold text-text-primary">Forgot password</h1>
      <p className="mt-wilms-2 text-body text-text-muted">
        Enter your email and we will send a secure reset link if an account exists.
      </p>

      {submitted ? (
        <Alert variant="success" title="Check your email" className="mt-wilms-4">
          If an account exists for that email, a reset link has been sent.
        </Alert>
      ) : (
        <form className="mt-wilms-6 space-y-wilms-4" onSubmit={onSubmit}>
          {submitError ? <Alert variant="error" title="Unable to send reset link">{submitError}</Alert> : null}
          <div>
            <label htmlFor="email" className="mb-wilms-2 block text-small font-medium text-text-primary">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email', { required: 'Email is required.' })}
            />
            {errors.email ? <p className="mt-wilms-1 text-small text-danger">{errors.email.message}</p> : null}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="mt-wilms-6 text-center text-small text-text-muted">
        <Link href="/login" className="font-semibold text-brand-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
