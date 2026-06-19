'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { APP_LOCK_PIN_LENGTH } from '@/constants/app-lock';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export interface PinEntryPadProps {
  label: string;
  onComplete: (pin: string) => void;
  errorMessage?: string | null;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export interface PinEntryPadHandle {
  focusInput: () => void;
}

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'] as const;

function normalizePinInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, APP_LOCK_PIN_LENGTH);
}

function useCoarsePointerDevice(): boolean {
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia('(max-width: 767px), (pointer: coarse)');

    const update = () => {
      setIsCoarse(media.matches);
    };

    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, []);

  return isCoarse;
}

export const PinEntryPad = forwardRef<PinEntryPadHandle, PinEntryPadProps>(function PinEntryPad(
  {
    label,
    onComplete,
    errorMessage,
    disabled = false,
    className,
    autoFocus = true,
  },
  ref,
) {
  const [digits, setDigits] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const useKeypadOnly = useCoarsePointerDevice();

  const submitPin = useCallback(
    (pin: string) => {
      if (pin.length === APP_LOCK_PIN_LENGTH) {
        onComplete(pin);
        setDigits('');
      }
    },
    [onComplete],
  );

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    },
  }));

  useEffect(() => {
    submitPin(digits);
  }, [digits, submitPin]);

  useEffect(() => {
    if (errorMessage) {
      setDigits('');
      inputRef.current?.focus();
    }
  }, [errorMessage]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  const appendDigit = useCallback((digit: string) => {
    setDigits((current) => normalizePinInput(`${current}${digit}`));
  }, []);

  const removeDigit = useCallback(() => {
    setDigits((current) => current.slice(0, -1));
  }, []);

  const handleKey = (key: (typeof PIN_KEYS)[number]) => {
    if (disabled) {
      return;
    }

    if (key === 'clear') {
      setDigits('');
      inputRef.current?.focus();
      return;
    }

    if (key === 'backspace') {
      removeDigit();
      inputRef.current?.focus();
      return;
    }

    appendDigit(key);
    inputRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    if (disabled || useKeypadOnly) {
      return;
    }

    setDigits(normalizePinInput(value));
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (disabled || useKeypadOnly) {
      event.preventDefault();
      return;
    }

    if (/^\d$/.test(event.key)) {
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      removeDigit();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      submitPin(digits);
    }
  };

  useEffect(() => {
    if (useKeypadOnly) {
      return;
    }

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (disabled) {
        return;
      }

      const activeElement = document.activeElement;
      const isFocusedInPad =
        containerRef.current?.contains(activeElement) || activeElement === inputRef.current;

      if (!isFocusedInPad) {
        return;
      }

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        appendDigit(event.key);
        return;
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        removeDigit();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        submitPin(digits);
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [appendDigit, disabled, digits, removeDigit, submitPin, useKeypadOnly]);

  return (
    <div ref={containerRef} className={cn('space-y-wilms-4', className)}>
      <p className="text-center text-body font-semibold text-text-primary">{label}</p>

      <input
        ref={inputRef}
        type="password"
        inputMode={useKeypadOnly ? 'none' : 'numeric'}
        readOnly={useKeypadOnly}
        autoComplete="one-time-code"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={label}
        value={digits}
        maxLength={APP_LOCK_PIN_LENGTH}
        disabled={disabled}
        tabIndex={0}
        className="sr-only"
        onChange={(event) => handleInputChange(event.target.value)}
        onKeyDown={handleInputKeyDown}
      />

      <button
        type="button"
        className="flex w-full justify-center gap-wilms-2"
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => inputRef.current?.focus()}
      >
        {Array.from({ length: APP_LOCK_PIN_LENGTH }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'h-3 w-3 rounded-full border border-border',
              index < digits.length ? 'bg-brand-primary' : 'bg-card',
            )}
          />
        ))}
      </button>

      <p className="text-center text-small text-text-muted">
        {useKeypadOnly
          ? 'Use the on-screen keypad below.'
          : 'Use the keypad or your keyboard (0–9, Backspace, Delete, Enter)'}
      </p>

      <p
        role="status"
        aria-live="polite"
        className="min-h-[1.25rem] text-center text-small text-danger"
      >
        {errorMessage ?? ''}
      </p>

      <div className="mx-auto grid max-w-xs grid-cols-3 gap-wilms-2">
        {PIN_KEYS.map((key) => {
          if (key === 'clear') {
            return (
              <Button
                key={key}
                type="button"
                variant="ghost"
                size="lg"
                disabled={disabled}
                tabIndex={0}
                className="min-h-[44px]"
                onClick={() => handleKey(key)}
                aria-label="Clear PIN"
              >
                Clear
              </Button>
            );
          }

          if (key === 'backspace') {
            return (
              <Button
                key={key}
                type="button"
                variant="ghost"
                size="lg"
                disabled={disabled}
                tabIndex={0}
                className="min-h-[44px]"
                onClick={() => handleKey(key)}
                aria-label="Delete last digit"
              >
                Del
              </Button>
            );
          }

          return (
            <Button
              key={key}
              type="button"
              variant="secondary"
              size="lg"
              disabled={disabled}
              tabIndex={0}
              className="min-h-[44px]"
              onClick={() => handleKey(key)}
              aria-label={`Digit ${key}`}
            >
              {key}
            </Button>
          );
        })}
      </div>
    </div>
  );
});
