import { beforeEach, describe, expect, it } from 'vitest';
import { TOAST_MAX_VISIBLE } from '@/constants/toast';
import { useUiStore } from '@/state/uiStore';
import { TOAST_VARIANT } from '@/types/toast';

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      toasts: [],
      isMobileNavOpen: false,
      isGlobalSearchOpen: false,
      isNotificationPanelOpen: false,
      isHelpMenuOpen: false,
    });
  });

  it('adds and dismisses toasts', () => {
    const id = useUiStore.getState().addToast({
      variant: TOAST_VARIANT.SUCCESS,
      title: 'Saved',
    });

    expect(useUiStore.getState().toasts).toHaveLength(1);
    useUiStore.getState().dismissToast(id);
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it('deduplicates toasts by dedupeKey', () => {
    const firstId = useUiStore.getState().addToast({
      variant: TOAST_VARIANT.INFO,
      title: 'Message',
      dedupeKey: 'notification:abc',
    });
    const secondId = useUiStore.getState().addToast({
      variant: TOAST_VARIANT.INFO,
      title: 'Message duplicate',
      dedupeKey: 'notification:abc',
    });

    expect(firstId).toBe(secondId);
    expect(useUiStore.getState().toasts).toHaveLength(1);
  });

  it('caps visible toasts at TOAST_MAX_VISIBLE', () => {
    for (let index = 0; index < TOAST_MAX_VISIBLE + 2; index += 1) {
      useUiStore.getState().addToast({
        variant: TOAST_VARIANT.INFO,
        title: `Toast ${index}`,
      });
    }

    expect(useUiStore.getState().toasts).toHaveLength(TOAST_MAX_VISIBLE);
  });

  it('toggles mobile navigation drawer state', () => {
    expect(useUiStore.getState().isMobileNavOpen).toBe(false);
    useUiStore.getState().openMobileNav();
    expect(useUiStore.getState().isMobileNavOpen).toBe(true);
    useUiStore.getState().closeMobileNav();
    expect(useUiStore.getState().isMobileNavOpen).toBe(false);
  });

  it('opens global search and closes notification panel', () => {
    useUiStore.getState().openNotificationPanel();
    useUiStore.getState().openGlobalSearch();

    expect(useUiStore.getState().isGlobalSearchOpen).toBe(true);
    expect(useUiStore.getState().isNotificationPanelOpen).toBe(false);
    useUiStore.getState().closeGlobalSearch();
    expect(useUiStore.getState().isGlobalSearchOpen).toBe(false);
  });

  it('opens help menu and closes other overlays', () => {
    useUiStore.getState().openGlobalSearch();
    useUiStore.getState().openHelpMenu();

    expect(useUiStore.getState().isHelpMenuOpen).toBe(true);
    expect(useUiStore.getState().isGlobalSearchOpen).toBe(false);
    useUiStore.getState().closeHelpMenu();
    expect(useUiStore.getState().isHelpMenuOpen).toBe(false);
  });
});

