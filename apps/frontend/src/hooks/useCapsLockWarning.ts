'use client';

import { startTransition, useCallback, useRef, useState, type KeyboardEvent } from 'react';

export function useCapsLockWarning() {
  const [capsLockOn, setCapsLockOn] = useState(false);
  const capsLockOnRef = useRef(false);

  const handleKeyEvent = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    const next = event.getModifierState('CapsLock');
    if (next === capsLockOnRef.current) {
      return;
    }
    capsLockOnRef.current = next;
    // Keep Caps Lock UI off the typing critical path (INP).
    startTransition(() => {
      setCapsLockOn(next);
    });
  }, []);

  const handleBlur = useCallback(() => {
    if (!capsLockOnRef.current) {
      return;
    }
    capsLockOnRef.current = false;
    startTransition(() => {
      setCapsLockOn(false);
    });
  }, []);

  return { capsLockOn, handleKeyEvent, handleBlur };
}
