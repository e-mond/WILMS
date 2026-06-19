'use client';

import { Button } from '@/components/ui/Button';

export default function RegistrationOfficerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError = error.name === 'ChunkLoadError' || error.message.includes('Loading chunk');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-wilms-4 bg-background px-wilms-4 text-center">
      <h1 className="text-heading-1 font-semibold text-text-primary">
        {isChunkError ? 'Page failed to load' : 'Something went wrong'}
      </h1>
      <p className="max-w-md text-body text-text-muted">
        {isChunkError
          ? 'The registration officer workspace could not load. Try again or refresh the page.'
          : error.message}
      </p>
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
