'use client';

import { useEffect, type ReactNode } from 'react';
import { useOptionalAsideDispatch } from '@/components/layout/shell/AsideSlotContext';

export function useShellAsideContent(content: ReactNode | null): void {
  const dispatch = useOptionalAsideDispatch();

  useEffect(() => {
    if (!dispatch) {
      return;
    }

    dispatch.setContent(content);

    return () => {
      dispatch.setContent(null);
    };
  }, [dispatch, content]);
}
