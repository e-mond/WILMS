'use client';

import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useReplayProductTour } from '@/components/onboarding/ProductTourOverlay';
import {
  TOUR_TRACK_CORE,
  getTourPageTip,
  type TourPageTipKey,
} from '@/components/onboarding/tour-catalog';
import { cn } from '@/utils/cn';

export function TourPageTip({
  pageKey,
  className,
}: {
  pageKey: TourPageTipKey;
  className?: string;
}) {
  const { user } = useAuth();
  const replayTour = useReplayProductTour();
  const tip = getTourPageTip(pageKey);

  if (tip.roleHint && user?.role && tip.roleHint !== user.role) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-wilms-2 rounded-xl border border-brand-primary/20 bg-brand-primary-light/30 px-wilms-4 py-wilms-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      data-tour={`page-tip-${pageKey}`}
    >
      <div className="min-w-0">
        <p className="inline-flex items-center gap-1.5 text-small font-semibold text-text-primary">
          <Compass className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
          {tip.title}
        </p>
        <p className="mt-0.5 text-small text-text-muted">{tip.body}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="shrink-0"
        onClick={() => replayTour(tip.trackId || TOUR_TRACK_CORE)}
      >
        Start tour here
      </Button>
    </div>
  );
}
