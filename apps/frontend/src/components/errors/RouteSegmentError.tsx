'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { USER_FACING_ERRORS, presentUserFacingError } from '@/lib/errors/user-friendly-error';
import { errorTracking } from '@/services/errorTracking';

interface RouteSegmentErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export default function RouteSegmentError({
  error,
  reset,
  title = "This section isn't available right now",
}: RouteSegmentErrorProps) {
  useEffect(() => {
    errorTracking.captureException(error, { boundary: 'route-segment' });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-wilms-4 px-wilms-4 text-center">
      <h1 className="text-heading-2 font-semibold text-text-primary">{title}</h1>
      <p className="text-body text-text-muted">
        {presentUserFacingError(error, USER_FACING_ERRORS.generic)}
      </p>
      <Button type="button" variant="secondary" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
