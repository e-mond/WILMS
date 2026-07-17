'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { attemptChunkRecovery, isChunkLoadError } from '@/lib/chunk-recovery';
import { USER_FACING_ERRORS, presentUserFacingError } from '@/lib/errors/user-friendly-error';
import { errorTracking } from '@/services/errorTracking';

export default function RegistrationOfficerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError = isChunkLoadError(error);

  useEffect(() => {
    if (isChunkError) {
      attemptChunkRecovery();
      return;
    }

    errorTracking.captureException(error, { boundary: 'registration-officer' });
  }, [error, isChunkError]);

  const message = isChunkError
    ? 'A newer version of WILMS is available. The page will refresh automatically — or use the button below.'
    : presentUserFacingError(error, USER_FACING_ERRORS.generic);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-wilms-4 bg-background px-wilms-4 text-center">
      <h1 className="text-heading-1 font-semibold text-text-primary">
        {isChunkError ? 'Page failed to load' : "This page isn't available right now"}
      </h1>
      <p className="max-w-md text-body text-text-muted">{message}</p>
      <div className="flex flex-wrap justify-center gap-wilms-2">
        <Button type="button" variant="primary" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
          Refresh page
        </Button>
      </div>
    </div>
  );
}
