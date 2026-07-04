'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react'; // Assuming lucide-react icons are available

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  side?: 'left' | 'right';
  sidebarVariant?: 'executive' | 'standard';
  hideHeader?: boolean;
  /** Width of the drawer (Tailwind class or arbitrary value) */
  width?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  className,
  side = 'left',
  sidebarVariant,
  hideHeader = false,
  width = 'w-80',
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current || !isOpen) {
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
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose, isOpen],
  );

  // Handle mount/unmount with animation support
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      // Allow exit animation before unmounting
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // Match transition duration
      return () => clearTimeout(timer);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      const previous = previousFocusRef.current;
      previousFocusRef.current = null;
      if (previous?.isConnected) {
        previous.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  // Auto-focus first focusable element
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const timer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusable?.[0];
      if (first?.isConnected) {
        first.focus();
      }
    }, 50);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen && !isAnimating) {
    return null;
  }

  const translateClass =
    side === 'left'
      ? isOpen
        ? 'translate-x-0'
        : '-translate-x-full'
      : isOpen
      ? 'translate-x-0'
      : 'translate-x-full';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex"
      role="presentation"
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close drawer overlay"
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0',
          'backdrop-blur-sm',
        )}
        onClick={onClose}
        tabIndex={-1}
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 flex h-full flex-col border-border shadow-xl transition-transform duration-300 ease-out',
          // Responsive width
          width,
          'max-w-[92vw] sm:max-w-[420px]',
          sidebarVariant === 'executive'
            ? 'bg-executive-sidebar text-text-primary'
            : 'bg-card text-text-primary',
          side === 'left' ? 'border-r' : 'ml-auto border-l',
          translateClass,
          className,
        )}
        data-sidebar={sidebarVariant === 'executive' ? 'executive' : undefined}
      >
        {hideHeader ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : null}

        {/* Header */}
        {!hideHeader ? (
          <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
            <h2
              id={titleId}
              className="text-lg font-semibold text-text-primary truncate pr-2"
            >
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        ) : null}

        {/* Content */}
        <div
          className={cn(
            'flex-1 overflow-y-auto',
            hideHeader ? 'p-0' : 'p-6',
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}