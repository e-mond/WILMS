import { create } from 'zustand';
import { DEFAULT_TOAST_DURATION_MS, TOAST_MAX_VISIBLE } from '@/constants/toast';
import type { ToastInput, ToastItem } from '@/types/toast';

interface UiState {
  toasts: ToastItem[];
  isMobileNavOpen: boolean;
  isAsideDrawerOpen: boolean;
  isGlobalSearchOpen: boolean;
  isNotificationPanelOpen: boolean;
  addToast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  openAsideDrawer: () => void;
  closeAsideDrawer: () => void;
  openGlobalSearch: () => void;
  closeGlobalSearch: () => void;
  openNotificationPanel: () => void;
  closeNotificationPanel: () => void;
}

function createToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useUiStore = create<UiState>()((set, get) => ({
  toasts: [],
  isMobileNavOpen: false,
  isAsideDrawerOpen: false,
  isGlobalSearchOpen: false,
  isNotificationPanelOpen: false,

  addToast: (input) => {
    const id = createToastId();
    const toast: ToastItem = {
      ...input,
      id,
      durationMs: input.durationMs ?? DEFAULT_TOAST_DURATION_MS,
      createdAt: Date.now(),
    };

    set((state) => ({
      toasts: [toast, ...state.toasts].slice(0, TOAST_MAX_VISIBLE),
    }));

    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  openMobileNav: () => {
    set({ isMobileNavOpen: true });
  },

  closeMobileNav: () => {
    set({ isMobileNavOpen: false });
  },

  toggleMobileNav: () => {
    set({ isMobileNavOpen: !get().isMobileNavOpen });
  },

  openAsideDrawer: () => {
    set({ isAsideDrawerOpen: true, isMobileNavOpen: false });
  },

  closeAsideDrawer: () => {
    set({ isAsideDrawerOpen: false });
  },

  openGlobalSearch: () => {
    set({ isGlobalSearchOpen: true, isNotificationPanelOpen: false });
  },

  closeGlobalSearch: () => {
    set({ isGlobalSearchOpen: false });
  },

  openNotificationPanel: () => {
    set({ isNotificationPanelOpen: true, isGlobalSearchOpen: false });
  },

  closeNotificationPanel: () => {
    set({ isNotificationPanelOpen: false });
  },
}));
