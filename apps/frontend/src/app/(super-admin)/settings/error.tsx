'use client';

import RouteSegmentError from '@/components/errors/RouteSegmentError';

export default function SettingsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteSegmentError {...props} title="Settings unavailable" />;
}
