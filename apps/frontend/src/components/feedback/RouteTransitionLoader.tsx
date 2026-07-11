'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';

const ROUTE_TRANSITION_MS = 320;

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (previousPath.current === pathname) {
      return;
    }

    previousPath.current = pathname;
    setIsTransitioning(true);
    setProgress(12);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : current + 8));
    }, 40);

    const completeTimer = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => {
        setIsTransitioning(false);
        setProgress(0);
      }, 120);
    }, ROUTE_TRANSITION_MS);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(completeTimer);
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
      aria-label="Loading page"
      className="pointer-events-none fixed inset-x-0 top-0 z-[80]"
    >
      <div className="h-0.5 w-full bg-border">
        <div
          className={cn('h-full bg-brand-primary transition-[width] duration-150 ease-out')}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
