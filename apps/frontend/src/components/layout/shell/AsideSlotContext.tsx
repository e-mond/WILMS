'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface AsideDispatchContextValue {
  setContent: (content: ReactNode | null) => void;
  clearContent: () => void;
}

const AsideContentContext = createContext<ReactNode | null>(null);
const AsideDispatchContext = createContext<AsideDispatchContextValue | null>(null);

export function AsideSlotProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<ReactNode | null>(null);

  const setContent = useCallback((newContent: ReactNode | null) => {
    setContentState(newContent);
  }, []);

  const clearContent = useCallback(() => {
    setContentState(null);
  }, []);

  const dispatch = useMemo(
    () => ({
      setContent,
      clearContent,
    }),
    [setContent, clearContent],
  );

  return (
    <AsideDispatchContext.Provider value={dispatch}>
      <AsideContentContext.Provider value={content}>{children}</AsideContentContext.Provider>
    </AsideDispatchContext.Provider>
  );
}

export function useAsideContent(): ReactNode | null {
  return useContext(AsideContentContext);
}

export function useAsideDispatch(): AsideDispatchContextValue {
  const dispatch = useContext(AsideDispatchContext);

  if (!dispatch) {
    throw new Error('useAsideDispatch must be used within an AsideSlotProvider');
  }

  return dispatch;
}

export function useOptionalAsideDispatch(): AsideDispatchContextValue | null {
  return useContext(AsideDispatchContext);
}

/** @deprecated Prefer useAsideContent + useAsideDispatch for stable subscriptions. */
export function useOptionalAsideSlot() {
  const content = useAsideContent();
  const dispatch = useOptionalAsideDispatch();

  if (!dispatch) {
    return null;
  }

  return {
    content,
    setContent: dispatch.setContent,
    clearContent: dispatch.clearContent,
    isFilled: content !== null,
  };
}

/** @deprecated Prefer useAsideContent + useAsideDispatch for stable subscriptions. */
export function useAsideSlot() {
  const slot = useOptionalAsideSlot();

  if (!slot) {
    throw new Error('useAsideSlot must be used within an AsideSlotProvider');
  }

  return slot;
}
