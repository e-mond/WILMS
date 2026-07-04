'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { Button } from './Button';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) {
        return;
      }

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusable?.[0];
      if (first?.isConnected) {
        first.focus();
      }
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      const previous = previousFocusRef.current;
      previousFocusRef.current = null;
      if (previous?.isConnected) {
        previous.focus();
      }
    };
  }, [handleKeyDown, isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-wilms-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="absolute inset-0 bg-text-primary/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-sm border border-border bg-card p-wilms-6 shadow-none',
          className,
        )}
      >
        <div className="mb-wilms-4 flex shrink-0 items-start justify-between gap-wilms-4">
          <h2 id={titleId} className="text-heading-2 font-semibold text-text-primary">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto text-body text-text-primary">{children}</div>
        {footer ? (
          <div className="mt-wilms-6 flex shrink-0 flex-wrap items-center justify-end gap-wilms-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
