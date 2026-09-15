'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Award, CheckCircle2, Compass, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { type UserRole } from '@/constants/roles';
import { useUiStore } from '@/state/uiStore';
import { cn } from '@/utils/cn';
import {
  TOUR_TRACK_CORE,
  getTourChapters,
  getTourCompletion,
  getTourStepsForTrack,
  shouldOpenMobileNavForStep,
  type ProductTourStep,
  type TourChapter,
} from '@/components/onboarding/tour-catalog';

const TOUR_COMPLETED_PREFIX = 'wilms-product-tour-completed';
const TOUR_WELCOME_PREFIX = 'wilms-product-tour-welcome';
const TOUR_NEVER_SHOW_KEY = 'wilms-product-tour-never-show';
const TOUR_PROGRESS_PREFIX = 'wilms-product-tour-progress';
const TOUR_ANALYTICS_PREFIX = 'wilms-product-tour-analytics';
export const TOUR_START_EVENT = 'wilms-product-tour-start';

const SPOTLIGHT_PAD = 10;
const MOBILE_NAV_MQ = '(max-width: 767px)';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourProgressState {
  trackId: string;
  stepIndex: number;
}

export type TourStartDetail = {
  trackId?: string;
  force?: boolean;
};

type TourPhase = 'welcome' | 'tour' | 'exit-confirm' | 'complete' | 'idle';

function completedKey(role: UserRole): string {
  return `${TOUR_COMPLETED_PREFIX}:${role}`;
}

function welcomeKey(userId: string): string {
  return `${TOUR_WELCOME_PREFIX}:${userId}`;
}

function progressKey(role: UserRole): string {
  return `${TOUR_PROGRESS_PREFIX}:${role}`;
}

function analyticsKey(role: UserRole): string {
  return `${TOUR_ANALYTICS_PREFIX}:${role}`;
}

function readProgress(role: UserRole): TourProgressState | null {
  try {
    const raw = localStorage.getItem(progressKey(role));
    if (!raw) {
      return null;
    }
    if (/^\d+$/.test(raw)) {
      return { trackId: TOUR_TRACK_CORE, stepIndex: Number(raw) };
    }
    const parsed = JSON.parse(raw) as TourProgressState;
    if (typeof parsed?.trackId === 'string' && Number.isFinite(parsed.stepIndex)) {
      return parsed;
    }
  } catch {
    // Ignore corrupt progress.
  }
  return null;
}

function writeProgress(role: UserRole, trackId: string, stepIndex: number) {
  localStorage.setItem(progressKey(role), JSON.stringify({ trackId, stepIndex }));
}

function recordTourAnalytics(role: UserRole, event: string, stepId?: string) {
  try {
    const raw = localStorage.getItem(analyticsKey(role));
    const existing = raw ? (JSON.parse(raw) as Array<Record<string, string>>) : [];
    existing.push({
      event,
      stepId: stepId ?? '',
      at: new Date().toISOString(),
    });
    localStorage.setItem(analyticsKey(role), JSON.stringify(existing.slice(-50)));
  } catch {
    // Analytics must never break the tour.
  }
}

function measureSpotlight(selector?: string): SpotlightRect | null {
  if (!selector) {
    return null;
  }

  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 && rect.height <= 0) {
    return null;
  }

  return {
    top: Math.max(0, rect.top - SPOTLIGHT_PAD),
    left: Math.max(0, rect.left - SPOTLIGHT_PAD),
    width: rect.width + SPOTLIGHT_PAD * 2,
    height: rect.height + SPOTLIGHT_PAD * 2,
  };
}

function scrollTourTarget(selector?: string) {
  if (!selector) {
    return;
  }
  const element = document.querySelector(selector);
  if (element instanceof HTMLElement) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }
}

function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_NAV_MQ).matches;
}

function clearTourDismissal(role: UserRole, userId: string) {
  localStorage.removeItem(completedKey(role));
  localStorage.removeItem(welcomeKey(userId));
  localStorage.removeItem(TOUR_NEVER_SHOW_KEY);
}

export function useProductTour() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const openMobileNav = useUiStore((state) => state.openMobileNav);
  const closeMobileNav = useUiStore((state) => state.closeMobileNav);
  const role = user?.role;
  const userId = user?.id;
  const chapters = useMemo(() => (role ? getTourChapters(role) : []), [role]);
  const [trackId, setTrackId] = useState(TOUR_TRACK_CORE);
  const steps = useMemo(
    () => (role ? getTourStepsForTrack(role, trackId) : []),
    [role, trackId],
  );
  const [phase, setPhase] = useState<TourPhase>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  const completion = useMemo(
    () => (role ? getTourCompletion(role) : null),
    [role],
  );

  const activeChapter: TourChapter | undefined = chapters.find((chapter) => chapter.id === trackId);

  const refreshSpotlight = useCallback((selector?: string) => {
    setSpotlight(measureSpotlight(selector));
  }, []);

  const clearSpotlight = useCallback(() => {
    setSpotlight(null);
  }, []);

  const persistDismissal = useCallback(
    (options?: { neverShowAgain?: boolean }) => {
      const shouldNeverShow = options?.neverShowAgain ?? neverShowAgain;
      if (shouldNeverShow) {
        localStorage.setItem(TOUR_NEVER_SHOW_KEY, 'true');
      }
      if (userId) {
        localStorage.setItem(welcomeKey(userId), 'dismissed');
      }
      if (role) {
        localStorage.setItem(completedKey(role), 'true');
      }
    },
    [neverShowAgain, role, userId],
  );

  const openWelcome = useCallback(
    (nextTrackId: string = TOUR_TRACK_CORE) => {
      if (!role) {
        return;
      }
      const nextSteps = getTourStepsForTrack(role, nextTrackId);
      if (!nextSteps.length) {
        return;
      }
      setTrackId(nextTrackId);
      setStepIndex(0);
      setPhase('welcome');
    },
    [role],
  );

  const startTour = useCallback(
    (options?: { trackId?: string; resume?: boolean }) => {
      if (!role) {
        return;
      }

      const requestedTrack = options?.trackId ?? trackId ?? TOUR_TRACK_CORE;
      const nextSteps = getTourStepsForTrack(role, requestedTrack);
      let resumeAt = 0;

      if (options?.resume !== false) {
        const saved = readProgress(role);
        if (
          saved &&
          saved.trackId === requestedTrack &&
          saved.stepIndex > 0 &&
          saved.stepIndex < nextSteps.length
        ) {
          resumeAt = saved.stepIndex;
        }
      }

      setTrackId(requestedTrack);
      setStepIndex(resumeAt);
      setPhase('tour');
      recordTourAnalytics(
        role,
        resumeAt > 0 ? 'tour_resumed' : 'tour_started',
        nextSteps[resumeAt]?.id,
      );
    },
    [role, trackId],
  );

  const jumpToChapter = useCallback(
    (nextTrackId: string) => {
      if (!role) {
        return;
      }
      const nextSteps = getTourStepsForTrack(role, nextTrackId);
      if (!nextSteps.length) {
        return;
      }
      setTrackId(nextTrackId);
      setStepIndex(0);
      writeProgress(role, nextTrackId, 0);
      recordTourAnalytics(role, 'tour_chapter_jump', nextTrackId);
      setPhase('tour');
    },
    [role],
  );

  const closeTour = useCallback(
    (options?: { neverShowAgain?: boolean }) => {
      clearSpotlight();
      closeMobileNav();
      if (role) {
        localStorage.removeItem(progressKey(role));
        recordTourAnalytics(role, 'tour_completed_or_exited', steps[stepIndex]?.id);
      }
      if (typeof options?.neverShowAgain === 'boolean') {
        setNeverShowAgain(options.neverShowAgain);
      }
      persistDismissal(options);
      setHasSavedProgress(false);
      setPhase('idle');
      setIsNavigating(false);
    },
    [clearSpotlight, closeMobileNav, persistDismissal, role, stepIndex, steps],
  );

  const finishTour = useCallback(() => {
    clearSpotlight();
    closeMobileNav();
    if (role) {
      localStorage.removeItem(progressKey(role));
      recordTourAnalytics(role, 'tour_completed', steps[stepIndex]?.id);
      localStorage.setItem(completedKey(role), 'true');
    }
    if (userId) {
      localStorage.setItem(welcomeKey(userId), 'dismissed');
    }
    setHasSavedProgress(false);
    setIsNavigating(false);
    setPhase('complete');
  }, [clearSpotlight, closeMobileNav, role, stepIndex, steps, userId]);

  const dismissCompletion = useCallback(() => {
    setPhase('idle');
  }, []);

  const pauseTourForLater = useCallback(() => {
    clearSpotlight();
    closeMobileNav();
    if (role) {
      writeProgress(role, trackId, stepIndex);
      localStorage.removeItem(completedKey(role));
      if (userId) {
        localStorage.removeItem(welcomeKey(userId));
      }
      recordTourAnalytics(role, 'tour_paused', steps[stepIndex]?.id);
      setHasSavedProgress(true);
    }
    setPhase('idle');
    setIsNavigating(false);
  }, [clearSpotlight, closeMobileNav, role, stepIndex, steps, trackId, userId]);

  const requestExit = useCallback(() => {
    setPhase('exit-confirm');
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !role || !userId) {
      return;
    }

    const onStartRequest = (event: Event) => {
      const detail = (event as CustomEvent<TourStartDetail>).detail ?? {};
      const nextTrack = detail.trackId ?? TOUR_TRACK_CORE;
      if (detail.force) {
        clearTourDismissal(role, userId);
        localStorage.removeItem(progressKey(role));
        setHasSavedProgress(false);
      }
      openWelcome(nextTrack);
    };

    window.addEventListener(TOUR_START_EVENT, onStartRequest);
    return () => window.removeEventListener(TOUR_START_EVENT, onStartRequest);
  }, [isAuthenticated, openWelcome, role, userId]);

  useEffect(() => {
    if (!isAuthenticated || !role || !userId) {
      return;
    }

    if (localStorage.getItem(TOUR_NEVER_SHOW_KEY) === 'true') {
      return;
    }

    if (localStorage.getItem(completedKey(role)) === 'true') {
      return;
    }

    if (localStorage.getItem(welcomeKey(userId)) === 'dismissed') {
      return;
    }

    const saved = readProgress(role);
    if (saved) {
      setTrackId(saved.trackId);
      setHasSavedProgress(saved.stepIndex > 0);
    }

    const timer = window.setTimeout(() => {
      setPhase('welcome');
    }, 900);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, role, userId]);

  useEffect(() => {
    if (phase !== 'tour') {
      clearSpotlight();
      return;
    }

    const step = steps[stepIndex];
    if (!step) {
      return;
    }

    let cancelled = false;
    let highlightTimer: number | undefined;
    let navigateTimer: number | undefined;
    let mobileTimer: number | undefined;

    const runHighlight = () => {
      if (cancelled) {
        return;
      }
      scrollTourTarget(step.targetSelector);
      window.setTimeout(() => {
        if (!cancelled) {
          refreshSpotlight(step.targetSelector);
        }
      }, 280);
      setIsNavigating(false);
    };

    const prepareMobileNav = () => {
      if (isMobileViewport() && shouldOpenMobileNavForStep(step)) {
        openMobileNav();
        return 420;
      }
      closeMobileNav();
      return 0;
    };

    if (step.href) {
      setIsNavigating(true);
      router.push(step.href);
      navigateTimer = window.setTimeout(() => {
        const mobileDelay = prepareMobileNav();
        mobileTimer = window.setTimeout(runHighlight, mobileDelay);
      }, 700);
    } else {
      highlightTimer = window.setTimeout(() => {
        const mobileDelay = prepareMobileNav();
        mobileTimer = window.setTimeout(runHighlight, mobileDelay || 120);
      }, 80);
    }

    return () => {
      cancelled = true;
      if (highlightTimer) {
        window.clearTimeout(highlightTimer);
      }
      if (navigateTimer) {
        window.clearTimeout(navigateTimer);
      }
      if (mobileTimer) {
        window.clearTimeout(mobileTimer);
      }
    };
  }, [
    clearSpotlight,
    closeMobileNav,
    openMobileNav,
    phase,
    refreshSpotlight,
    router,
    stepIndex,
    steps,
  ]);

  useEffect(() => {
    if (phase !== 'tour') {
      return;
    }

    const step = steps[stepIndex];
    if (!step?.targetSelector) {
      return;
    }

    const onLayoutChange = () => refreshSpotlight(step.targetSelector);
    window.addEventListener('resize', onLayoutChange);
    window.addEventListener('scroll', onLayoutChange, true);
    return () => {
      window.removeEventListener('resize', onLayoutChange);
      window.removeEventListener('scroll', onLayoutChange, true);
    };
  }, [phase, refreshSpotlight, stepIndex, steps]);

  useEffect(() => {
    return () => {
      clearSpotlight();
    };
  }, [clearSpotlight]);

  const step = steps[stepIndex];
  const progressPercent = steps.length > 0 ? Math.round(((stepIndex + 1) / steps.length) * 100) : 0;

  return {
    steps,
    step,
    stepIndex,
    phase,
    trackId,
    chapters,
    activeChapter,
    neverShowAgain,
    setNeverShowAgain,
    isNavigating,
    progressPercent,
    spotlight,
    hasSavedProgress,
    completion,
    openWelcome,
    startTour,
    jumpToChapter,
    closeTour,
    finishTour,
    dismissCompletion,
    pauseTourForLater,
    requestExit,
    resumeTour: () => setPhase('tour'),
    nextStep: () => {
      if (stepIndex >= steps.length - 1) {
        finishTour();
        return;
      }
      const next = stepIndex + 1;
      setStepIndex(next);
      if (role) {
        writeProgress(role, trackId, next);
        recordTourAnalytics(role, 'tour_step', steps[next]?.id);
      }
    },
    previousStep: () => {
      const prev = Math.max(0, stepIndex - 1);
      setStepIndex(prev);
      if (role) {
        writeProgress(role, trackId, prev);
      }
    },
  };
}

function TourSpotlight({ rect }: { rect: SpotlightRect | null }) {
  const veil = 'bg-black/50 backdrop-blur-[2px]';

  if (!rect) {
    return <div className={cn('fixed inset-0 z-[119]', veil)} aria-hidden="true" />;
  }

  const { top, left, width, height } = rect;

  return (
    <div className="pointer-events-none fixed inset-0 z-[119]" aria-hidden="true">
      <div className={cn('absolute left-0 right-0 top-0', veil)} style={{ height: top }} />
      <div
        className={cn('absolute bottom-0 left-0 right-0', veil)}
        style={{ top: top + height }}
      />
      <div className={cn('absolute left-0', veil)} style={{ top, height, width: left }} />
      <div
        className={cn('absolute right-0', veil)}
        style={{ top, height, left: left + width }}
      />
      <div
        className="tour-highlight-pulse absolute rounded-lg ring-2 ring-brand-primary ring-offset-2 ring-offset-transparent"
        style={{ top, left, width, height }}
      />
      <div className="pointer-events-auto absolute" style={{ top, left, width, height }} />
    </div>
  );
}

function TourDialogShell({
  title,
  children,
  onKeyDown,
  progressPercent,
  showSpotlight,
  spotlight,
  compact,
  eyebrow,
}: {
  title: string;
  children: ReactNode;
  onKeyDown?: (event: KeyboardEvent) => void;
  progressPercent?: number;
  showSpotlight?: boolean;
  spotlight?: SpotlightRect | null;
  compact?: boolean;
  eyebrow?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = dialogRef.current;
    if (!root) {
      return;
    }

    const focusables = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));

    const first = focusables()[0];
    first?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Tab') {
        return;
      }
      const items = focusables();
      if (items.length === 0) {
        return;
      }
      const firstItem = items[0]!;
      const lastItem = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    root.addEventListener('keydown', handleKeyDown);
    return () => {
      root.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-[120] flex p-wilms-4',
        showSpotlight
          ? 'items-end justify-center sm:items-end sm:justify-end sm:p-wilms-6'
          : 'items-end justify-center sm:items-center',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
      onKeyDown={onKeyDown}
    >
      {showSpotlight ? (
        <TourSpotlight rect={spotlight ?? null} />
      ) : (
        <div className="fixed inset-0 z-[119] bg-black/50 backdrop-blur-[2px]" aria-hidden="true" />
      )}
      <div
        className={cn(
          'tour-dialog-panel relative z-[122] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl',
          compact ? 'max-w-md' : 'max-w-lg',
        )}
      >
        <div className="bg-gradient-to-br from-brand-primary/[0.12] via-brand-primary/[0.04] to-transparent px-wilms-5 pb-wilms-3 pt-wilms-5">
          <div className="flex items-start gap-wilms-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-primary/20 bg-card text-brand-primary shadow-sm">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                  {eyebrow}
                </p>
              ) : null}
              <h2
                id="product-tour-title"
                className="text-heading-2 font-semibold tracking-tight text-text-primary"
              >
                {title}
              </h2>
            </div>
          </div>
        </div>
        {typeof progressPercent === 'number' ? (
          <div
            className="h-1.5 bg-border/80"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Tour progress"
          >
            <div
              className="h-full rounded-r-full bg-brand-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        ) : (
          <div className="h-px bg-border/70" aria-hidden="true" />
        )}
        <div className="px-wilms-5 py-wilms-5">{children}</div>
      </div>
    </div>
  );
}

function ChapterSkipBar({
  chapters,
  activeTrackId,
  onJump,
}: {
  chapters: TourChapter[];
  activeTrackId: string;
  onJump: (trackId: string) => void;
}) {
  if (chapters.length <= 1) {
    return null;
  }

  return (
    <div className="mt-wilms-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Jump to section
      </p>
      <div className="mt-wilms-2 flex flex-wrap gap-1.5">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
              chapter.id === activeTrackId
                ? 'border-brand-primary bg-brand-primary-light text-brand-primary'
                : 'border-border bg-background text-text-muted hover:border-brand-primary/40 hover:text-text-primary',
            )}
            onClick={() => onJump(chapter.id)}
          >
            {chapter.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductTourOverlay() {
  const tour = useProductTour();

  if (tour.phase === 'idle') {
    return null;
  }

  if ((tour.phase === 'tour' || tour.phase === 'exit-confirm') && !tour.step) {
    return null;
  }

  if (tour.phase === 'welcome') {
    return (
      <TourDialogShell title="Welcome to WILMS" eyebrow="Guided product tour">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/20 bg-brand-primary-light px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {tour.activeChapter?.id === TOUR_TRACK_CORE ? 'About 2–3 minutes' : 'Deep-dive section'}
        </div>
        <p className="mt-wilms-3 text-body text-text-muted">
          WILMS is the Women&apos;s Interest-Free Loan Management System — your workspace for pools,
          registrations, collections, approvals, and reporting.
        </p>
        <p className="mt-wilms-2 text-body text-text-muted">
          {tour.activeChapter
            ? `${tour.activeChapter.label}: ${tour.activeChapter.description}`
            : 'This tour highlights the menus and pages you will use most often for your role.'}{' '}
          You can pause anytime, skip to another section, and resume later from Help.
        </p>
        <ChapterSkipBar
          chapters={tour.chapters}
          activeTrackId={tour.trackId}
          onJump={(nextTrackId) => tour.openWelcome(nextTrackId)}
        />
        <div className="mt-wilms-5 flex flex-wrap items-center justify-between gap-wilms-2 border-t border-border pt-wilms-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => tour.closeTour({ neverShowAgain: true })}
          >
            Don&apos;t show again
          </Button>
          <div className="flex flex-wrap gap-wilms-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => tour.closeTour({ neverShowAgain: false })}
            >
              Not now
            </Button>
            <Button type="button" onClick={() => tour.startTour({ trackId: tour.trackId })}>
              {tour.hasSavedProgress ? 'Resume tour' : 'Start tour'}
            </Button>
          </div>
        </div>
      </TourDialogShell>
    );
  }

  if (tour.phase === 'complete' && tour.completion) {
    return (
      <TourDialogShell title="You're ready" eyebrow="Tour complete" compact>
        <div className="flex flex-wrap items-center gap-wilms-2">
          <Badge variant="success" className="gap-1.5">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            Tour completed
          </Badge>
        </div>
        <p className="mt-wilms-3 text-body text-text-muted">
          Start with the recommended next step, then work through the quick-start checklist.
          {tour.chapters.length > 1
            ? ' More sections are available anytime from Help → tour chapters.'
            : null}
        </p>
        <div className="mt-wilms-4 rounded-xl border border-brand-primary/20 bg-brand-primary-light/40 p-wilms-3">
          <p className="text-small font-semibold text-text-primary">Next recommended action</p>
          <Link
            href={tour.completion.nextAction.href}
            className="mt-wilms-1 inline-flex text-body font-semibold text-brand-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            onClick={tour.dismissCompletion}
          >
            {tour.completion.nextAction.label}
          </Link>
        </div>
        <div className="mt-wilms-4">
          <p className="text-small font-semibold text-text-primary">Quick-start checklist</p>
          <ul className="mt-wilms-2 space-y-wilms-2">
            {tour.completion.checklist.map((item) => (
              <li key={item} className="flex items-start gap-wilms-2 text-body text-text-muted">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2 border-t border-border pt-wilms-4">
          <Button type="button" onClick={tour.dismissCompletion}>
            Done
          </Button>
        </div>
      </TourDialogShell>
    );
  }

  if (tour.phase === 'exit-confirm') {
    return (
      <TourDialogShell
        title="Leave the tour?"
        eyebrow="Exit confirmation"
        progressPercent={tour.progressPercent}
        showSpotlight
        spotlight={tour.spotlight}
      >
        <p className="text-body text-text-muted">
          Progress is only saved if you pause. You can restart anytime from Help.
        </p>
        <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2 border-t border-border pt-wilms-4">
          <Button type="button" variant="ghost" onClick={() => tour.closeTour()}>
            Exit
          </Button>
          <Button type="button" variant="secondary" onClick={tour.pauseTourForLater}>
            Pause
          </Button>
          <Button type="button" onClick={tour.resumeTour}>
            Continue
          </Button>
        </div>
      </TourDialogShell>
    );
  }

  if (tour.phase !== 'tour' || !tour.step) {
    return null;
  }

  return (
    <TourDialogShell
      title={tour.step.title}
      eyebrow={`${tour.activeChapter?.label ?? 'Tour'} · Step ${tour.stepIndex + 1} of ${tour.steps.length}`}
      progressPercent={tour.progressPercent}
      showSpotlight
      spotlight={tour.spotlight}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          tour.requestExit();
        }
        if (event.key === 'ArrowRight') {
          tour.nextStep();
        }
        if (event.key === 'ArrowLeft') {
          tour.previousStep();
        }
      }}
    >
      <div className="flex items-center justify-between gap-wilms-3">
        <div className="flex flex-wrap gap-1" aria-hidden="true">
          {tour.steps.map((entry, index) => (
            <span
              key={entry.id}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === tour.stepIndex
                  ? 'w-5 bg-brand-primary'
                  : index < tour.stepIndex
                    ? 'w-1.5 bg-brand-primary/60'
                    : 'w-1.5 bg-border',
              )}
            />
          ))}
        </div>
        {tour.isNavigating ? (
          <p className="text-small text-text-muted" aria-live="polite">
            Opening page…
          </p>
        ) : null}
      </div>
      <p className="mt-wilms-3 text-body leading-relaxed text-text-muted">{tour.step.body}</p>
      <ChapterSkipBar
        chapters={tour.chapters}
        activeTrackId={tour.trackId}
        onJump={tour.jumpToChapter}
      />
      <p className="mt-wilms-2 text-[11px] text-text-muted">
        ← → to move · Esc to exit · Pause saves progress
      </p>
      <div className="mt-wilms-5 flex flex-wrap items-center justify-between gap-wilms-2 border-t border-border pt-wilms-4">
        <div className="flex flex-wrap gap-wilms-1">
          <Button type="button" variant="ghost" size="sm" onClick={tour.requestExit}>
            Skip
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={tour.pauseTourForLater}>
            Pause
          </Button>
        </div>
        <div className="flex flex-wrap gap-wilms-2">
          {tour.stepIndex > 0 ? (
            <Button type="button" variant="secondary" onClick={tour.previousStep}>
              Back
            </Button>
          ) : null}
          <Button type="button" className="min-w-[6.5rem]" onClick={tour.nextStep}>
            {tour.stepIndex >= tour.steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </TourDialogShell>
  );
}

export function useReplayProductTour() {
  const { user } = useAuth();

  return useCallback(
    (trackId: string = TOUR_TRACK_CORE) => {
      if (!user?.role || !user.id) {
        return;
      }
      clearTourDismissal(user.role, user.id);
      localStorage.removeItem(progressKey(user.role));
      window.dispatchEvent(
        new CustomEvent<TourStartDetail>(TOUR_START_EVENT, {
          detail: { trackId, force: true },
        }),
      );
    },
    [user?.id, user?.role],
  );
}

export type { ProductTourStep };
