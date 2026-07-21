'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { PasswordField } from '@/components/forms/PasswordField';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { AuthCard } from '@/features/authentication/components/AuthCard';
import { AuthTrustStrip } from '@/features/authentication/components/AuthTrustStrip';
import { Input } from '@/components/ui/Input';
import { resolveSafeRedirect } from '@/lib/auth/redirect';
import { authService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import { ApiError } from '@/types/api';

interface CompleteProfileFormInput {
  displayName: string;
  newPassword: string;
  confirmPassword: string;
  phone: string;
  branch: string;
  region: string;
  zone: string;
}

export function CompleteProfileForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const user = useAuthStore((state) => state.user);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileFormInput>({
    defaultValues: {
      displayName: user?.displayName ?? '',
      newPassword: '',
      confirmPassword: '',
      phone: '',
      branch: '',
      region: '',
      zone: '',
    },
  });

  const newPassword = watch('newPassword');

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    if (values.newPassword !== values.confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    try {
      const result = await authService.completeOnboarding({
        displayName: values.displayName.trim(),
        newPassword: values.newPassword,
        phone: values.phone.trim() || undefined,
        branch: values.branch.trim() || undefined,
        region: values.region.trim() || undefined,
        zone: values.zone.trim() || undefined,
      });

      setSession(result.user, result.expiresAt);
      void queryClient.invalidateQueries({ queryKey: ['settings', 'users'] });
      router.replace(resolveSafeRedirect(null, result.user.role));
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError('Unable to complete setup right now. Please try again.');
    }
  });

  return (
    <AuthCard className="rounded-xl">
      <div className="space-y-wilms-8">
        <div className="space-y-wilms-3 text-center">
          <h1 className="text-heading-1 font-semibold text-text-primary">Set up your profile</h1>
          <p className="text-body text-text-secondary">
            Choose a new password and add your contact details. You can add a profile photo later in
            settings.
          </p>
        </div>

        <form className="space-y-wilms-4" noValidate onSubmit={(event) => void onSubmit(event)}>
          {submitError ? (
            <Alert title="Setup failed" variant="error">
              {submitError}
            </Alert>
          ) : null}

          <div className="space-y-wilms-2">
            <label htmlFor="profile-name" className="text-small font-semibold text-text-primary">
              Full name
            </label>
            <Input
              id="profile-name"
              hasError={Boolean(errors.displayName)}
              {...register('displayName', { required: 'Full name is required.' })}
            />
            {errors.displayName ? (
              <p className="text-small text-danger">{errors.displayName.message}</p>
            ) : null}
          </div>

          <PasswordField
            id="profile-password"
            label="New password"
            autoComplete="new-password"
            hasError={Boolean(errors.newPassword)}
            errorMessage={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'Password is required.',
              minLength: { value: 10, message: 'Password must be at least 10 characters.' },
            })}
          />

          <PasswordField
            id="profile-confirm-password"
            label="Confirm password"
            autoComplete="new-password"
            hasError={Boolean(errors.confirmPassword)}
            errorMessage={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password.',
              validate: (value) => value === newPassword || 'Passwords do not match.',
            })}
          />

          <div className="space-y-wilms-2">
            <label htmlFor="profile-phone" className="text-small font-semibold text-text-primary">
              Phone number
            </label>
            <Input id="profile-phone" type="tel" placeholder="+233..." {...register('phone')} />
          </div>

          <div className="grid gap-wilms-4 md:grid-cols-3">
            <div className="space-y-wilms-2">
              <label htmlFor="profile-branch" className="text-small font-semibold text-text-primary">
                Branch
              </label>
              <Input id="profile-branch" {...register('branch')} />
            </div>
            <div className="space-y-wilms-2">
              <label htmlFor="profile-region" className="text-small font-semibold text-text-primary">
                Region
              </label>
              <Input id="profile-region" {...register('region')} />
            </div>
            <div className="space-y-wilms-2">
              <label htmlFor="profile-zone" className="text-small font-semibold text-text-primary">
                Zone
              </label>
              <Input id="profile-zone" {...register('zone')} />
            </div>
          </div>

          <LoadingButton
            type="submit"
            size="lg"
            className="w-full"
            loading={isSubmitting}
            loadingLabel="Saving…"
          >
            Activate account
          </LoadingButton>
        </form>

        <AuthTrustStrip />
      </div>
    </AuthCard>
  );
}
