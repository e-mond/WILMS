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
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onCloseRef.current();
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
  }, []);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    const shouldAutofocus = !wasOpenRef.current;
    wasOpenRef.current = true;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', handleKeyDown);

    let focusTimer: number | undefined;
    if (shouldAutofocus) {
      focusTimer = window.setTimeout(() => {
        const panel = panelRef.current;
        if (!panel) {
          return;
        }

        const target =
          panel.querySelector<HTMLElement>('[autofocus]') ??
          panel.querySelector<HTMLElement>(
            'input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
          ) ??
          panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);

        if (target?.isConnected) {
          target.focus();
        }
      }, 0);
    }

    return () => {
      if (focusTimer !== undefined) {
        window.clearTimeout(focusTimer);
      }
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
      <div
        aria-hidden="true"
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
