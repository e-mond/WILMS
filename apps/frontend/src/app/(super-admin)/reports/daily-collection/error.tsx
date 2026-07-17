'use client';

import RouteSegmentError from '@/components/errors/RouteSegmentError';

export default function CollectionsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteSegmentError {...props} title="Collections unavailable" />;
}
