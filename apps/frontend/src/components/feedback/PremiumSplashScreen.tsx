'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/utils/cn';

export type SplashPhase = 'launch' | 'logo' | 'fade' | 'loader' | 'complete';

export interface PremiumSplashScreenProps {
  phase: SplashPhase;
  loaderMessage?: string;
  onComplete?: () => void;
  className?: string;
}

const LOGO_DURATION_MS = 1200;
const FADE_DURATION_MS = 400;

export function PremiumSplashScreen({
  phase,
  loaderMessage = 'Loading…',
  onComplete,
  className,
}: PremiumSplashScreenProps) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (phase !== 'complete') {
      return;
    }

    const timeout = window.setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, reduceMotion ? 0 : FADE_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [phase, onComplete, reduceMotion]);

  if (!visible && phase === 'complete') {
    return null;
  }

  const showLoader = phase === 'loader' || phase === 'fade';
  const logoOpacity = phase === 'launch' ? 0 : phase === 'logo' || phase === 'loader' ? 1 : 0.6;

  if (reduceMotion) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy={phase !== 'complete'}
        className={cn(
          'fixed inset-0 z-[100] flex min-h-dvh flex-col items-center justify-center bg-background px-wilms-4 text-center',
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="WILMS" width={64} height={64} className="h-16 w-16 rounded-lg" />
        <p className="mt-wilms-4 text-small text-text-muted">{loaderMessage}</p>
      </div>
    );
  }

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-busy={phase !== 'complete'}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'complete' ? 0 : 1 }}
      transition={{ duration: FADE_DURATION_MS / 1000, ease: 'easeInOut' }}
      className={cn(
        'fixed inset-0 z-[100] flex min-h-dvh flex-col items-center justify-center bg-background px-wilms-4',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06),_transparent_70%)]"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: logoOpacity, scale: phase === 'launch' ? 0.88 : 1 }}
        transition={{
          duration: LOGO_DURATION_MS / 1000,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative flex flex-col items-center"
      >
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-brand-primary-light ring-1 ring-executive-gold/30 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="WILMS"
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: phase === 'launch' ? 0 : 1, y: phase === 'launch' ? 8 : 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
          className="mt-wilms-5 text-display font-bold tracking-wide text-brand-primary"
        >
          WILMS
        </motion.p>
      </motion.div>

      {showLoader ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          className="relative mt-wilms-10 flex flex-col items-center gap-wilms-3"
        >
          <div className="h-1 w-32 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-brand-primary"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-small text-text-muted">{loaderMessage}</p>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
