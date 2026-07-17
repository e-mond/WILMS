'use client';

import RouteSegmentError from '@/components/errors/RouteSegmentError';

export default function DashboardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteSegmentError {...props} title="Dashboard unavailable" />;
}
