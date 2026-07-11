'use client';

import { useCallback, useState, type KeyboardEvent } from 'react';

export function useCapsLockWarning() {
  const [capsLockOn, setCapsLockOn] = useState(false);

  const handleKeyEvent = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(event.getModifierState('CapsLock'));
  }, []);

  const handleBlur = useCallback(() => {
    setCapsLockOn(false);
  }, []);

  return { capsLockOn, handleKeyEvent, handleBlur };
}
