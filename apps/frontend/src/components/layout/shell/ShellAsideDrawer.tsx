'use client';

import { useAsideContent } from '@/components/layout/shell/AsideSlotContext';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useUiStore } from '@/state/uiStore';

export function ShellAsideDrawer() {
  const content = useAsideContent();
  const isAsideDrawerOpen = useUiStore((state) => state.isAsideDrawerOpen);
  const openAsideDrawer = useUiStore((state) => state.openAsideDrawer);
  const closeAsideDrawer = useUiStore((state) => state.closeAsideDrawer);

  if (!content) {
    return null;
  }

  return (
    <>
      <div className="pointer-events-none fixed bottom-wilms-4 right-wilms-4 z-40 xl:hidden">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="pointer-events-auto shadow-none"
          aria-label="Open context panel"
          aria-haspopup="dialog"
          onClick={openAsideDrawer}
        >
          Details
        </Button>
      </div>

      <Drawer
        isOpen={isAsideDrawerOpen}
        onClose={closeAsideDrawer}
        title="Context panel"
        side="right"
        className="w-80 max-w-[90vw] bg-card xl:hidden"
      >
        <div className="space-y-wilms-4">{content}</div>
      </Drawer>
    </>
  );
}
