import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { KeyboardEvent } from 'react';
import { useCapsLockWarning } from '@/hooks/useCapsLockWarning';

function makeKeyEvent(capsLockOn: boolean): KeyboardEvent<HTMLInputElement> {
  return {
    getModifierState: (key: string) => key === 'CapsLock' && capsLockOn,
  } as KeyboardEvent<HTMLInputElement>;
}

describe('useCapsLockWarning', () => {
  it('does not update state when Caps Lock status is unchanged', () => {
    const { result } = renderHook(() => useCapsLockWarning());

    act(() => {
      result.current.handleKeyEvent(makeKeyEvent(false));
      result.current.handleKeyEvent(makeKeyEvent(false));
    });

    expect(result.current.capsLockOn).toBe(false);
  });

  it('updates only when Caps Lock turns on or off', async () => {
    const { result } = renderHook(() => useCapsLockWarning());

    await act(async () => {
      result.current.handleKeyEvent(makeKeyEvent(true));
      await Promise.resolve();
    });
    expect(result.current.capsLockOn).toBe(true);

    await act(async () => {
      result.current.handleKeyEvent(makeKeyEvent(true));
      await Promise.resolve();
    });
    expect(result.current.capsLockOn).toBe(true);

    await act(async () => {
      result.current.handleKeyEvent(makeKeyEvent(false));
      await Promise.resolve();
    });
    expect(result.current.capsLockOn).toBe(false);
  });
});
