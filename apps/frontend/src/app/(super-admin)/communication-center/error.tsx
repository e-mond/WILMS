'use client';

import RouteSegmentError from '@/components/errors/RouteSegmentError';

export default function CommunicationCenterError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteSegmentError {...props} title="Communication Center unavailable" />;
}
