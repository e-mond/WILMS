'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { cn } from '@/utils/cn';

const ROUTE_TRANSITION_MS = 280;

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (previousPath.current === pathname) {
      return;
    }

    previousPath.current = pathname;
    setIsTransitioning(true);

    const timerId = window.setTimeout(() => {
      setIsTransitioning(false);
    }, ROUTE_TRANSITION_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [pathname]);

  if (!isTransitioning) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center pt-wilms-3',
      )}
    >
      <div className="rounded-full border border-border bg-card/95 px-wilms-4 py-wilms-2 shadow-sm backdrop-blur-sm">
        <LoadingSpinner label="Loading page" />
      </div>
    </div>
  );
}
