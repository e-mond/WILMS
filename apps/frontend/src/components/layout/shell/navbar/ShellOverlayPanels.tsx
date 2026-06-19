'use client';

import { GlobalSearchPanel } from '@/components/layout/shell/navbar/GlobalSearchPanel';
import { NotificationInboxPanel } from '@/components/layout/shell/navbar/NotificationInboxPanel';
import { useAuth } from '@/hooks/useAuth';

/** Mount once per shell so search/notification dialogs are not duplicated in the DOM. */
export function ShellOverlayPanels() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <>
      <GlobalSearchPanel />
      <NotificationInboxPanel />
    </>
  );
}
