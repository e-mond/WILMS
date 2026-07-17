'use client';

import RouteSegmentError from '@/components/errors/RouteSegmentError';

export default function LoanPoolsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteSegmentError {...props} title="Loan pools unavailable" />;
}
