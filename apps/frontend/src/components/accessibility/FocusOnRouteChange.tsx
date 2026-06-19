'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function FocusOnRouteChange() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const main = document.getElementById('main-content');

    if (main?.isConnected) {
      main.focus({ preventScroll: true });
    }
  }, [pathname]);

  return null;
}
