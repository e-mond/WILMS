'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { CircleCheck, ShieldCheck } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { AuthEmailField } from '@/components/forms/AuthEmailField';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { AuthBackLink } from '@/features/authentication/components/AuthBackLink';
import { AuthCard } from '@/features/authentication/components/AuthCard';
import { AuthTrustStrip } from '@/features/authentication/components/AuthTrustStrip';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/features/authentication/forgot-password.schema';
import { authService } from '@/services';
import { ApiError } from '@/types/api';

const RESEND_COOLDOWN_SECONDS = 60;

function resolveForgotPasswordError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return 'Too many reset requests. Please wait a few minutes and try again.';
    }

    if (typeof error.status === 'number' && error.status >= 500) {
      return 'Our servers are temporarily unavailable. Please try again shortly.';
    }

    return error.message;
  }

  if (error instanceof TypeError) {
    return 'You appear to be offline. Check your connection and try again.';
  }

  return "Unable to send the reset link right now. Please try again.";
}

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const sendResetLink = useCallback(async (email: string) => {
    setSubmitError(null);

    try {
      await authService.requestPasswordReset(email);
      setSubmittedEmail(email);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      return true;
    } catch (error) {
      setSubmitError(resolveForgotPasswordError(error));
      return false;
    }
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    const parsed = forgotPasswordSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'email') {
          setError('email', { type: 'manual', message: issue.message });
        }
      }
      return;
    }

    await sendResetLink(parsed.data.email);
  });

  const handleResend = async () => {
    if (!submittedEmail || resendCooldown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    await sendResetLink(submittedEmail);
    setIsResending(false);
  };

  if (submittedEmail) {
    return (
      <AuthCard className="rounded-xl">
        <div className="space-y-wilms-6">
          <div className="flex flex-col items-center gap-wilms-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light text-success">
              <CircleCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="space-y-wilms-2">
              <h1 className="text-heading-1 font-semibold text-text-primary">Check your email</h1>
              <p className="max-w-prose text-body text-text-secondary">
                If an account exists for this email, we&apos;ve sent a password reset link.
                Please check your inbox and spam folder.
              </p>
            </div>
          </div>

          <Alert variant="success" title="Reset link sent">
            For your security, we never confirm whether an email is registered with WILMS.
          </Alert>

          <div className="space-y-wilms-3">
            <LoadingButton
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              loading={isResending}
              loadingLabel="Sending…"
              disabled={resendCooldown > 0}
              onClick={() => void handleResend()}
            >
              {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend email'}
            </LoadingButton>

            <AuthBackLink className="justify-center w-full" />
          </div>

          <AuthTrustStrip message="Secure password reset. Your account information remains protected." />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard className="rounded-xl">
      <div className="space-y-wilms-6">
        <div className="space-y-wilms-2">
          <p className="text-small font-semibold uppercase tracking-wide text-executive-gold">
            Secure password recovery
          </p>
          <h1 className="text-heading-1 font-semibold text-text-primary">Forgot your password?</h1>
          <p className="max-w-prose text-body text-text-secondary">
            Enter the email associated with your account. We&apos;ll send a secure password reset
            link if the account exists.
          </p>
        </div>

        <ul className="space-y-wilms-2 text-small text-text-muted">
          <li className="flex items-start gap-wilms-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-executive-gold" aria-hidden="true" />
            <span>Encrypted communication</span>
          </li>
          <li className="flex items-start gap-wilms-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-executive-gold" aria-hidden="true" />
            <span>Your account information remains protected</span>
          </li>
        </ul>

        <form
          className="space-y-wilms-4"
          noValidate
          aria-describedby={submitError ? 'forgot-password-error' : undefined}
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(event);
          }}
        >
          {submitError ? (
            <Alert id="forgot-password-error" title="Unable to send reset link" variant="error">
              {submitError}
            </Alert>
          ) : null}

          <AuthEmailField
            id="forgot-password-email"
            autoComplete="username"
            hasError={Boolean(errors.email)}
            errorId="forgot-password-email-error"
            errorMessage={errors.email?.message}
            disabled={isSubmitting}
            {...register('email')}
          />

          <LoadingButton
            type="submit"
            size="lg"
            className="w-full"
            loading={isSubmitting}
            loadingLabel="Sending…"
          >
            Send Reset Link
          </LoadingButton>
        </form>

        <AuthBackLink />

        <AuthTrustStrip message="Secure password reset. Your account information remains protected." />

        <p className="text-center text-small text-text-muted">
          Need help?{' '}
          <Link href="/login" className="font-semibold text-brand-primary hover:underline">
            Contact your administrator
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
