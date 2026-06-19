import { beforeEach, describe, expect, it } from 'vitest';
import { SHELL_LAYOUT_STORAGE_KEY } from '@/constants/shell-layout';
import { useShellLayoutStore } from '@/state/shellLayoutStore';

describe('shellLayoutStore', () => {
  beforeEach(() => {
    localStorage.removeItem(SHELL_LAYOUT_STORAGE_KEY);
    useShellLayoutStore.setState({
      isSidebarCollapsed: false,
      isHydrated: true,
    });
  });

  it('toggles sidebar collapsed state', () => {
    expect(useShellLayoutStore.getState().isSidebarCollapsed).toBe(false);
    useShellLayoutStore.getState().toggleSidebarCollapsed();
    expect(useShellLayoutStore.getState().isSidebarCollapsed).toBe(true);
  });

  it('persists collapsed preference', () => {
    useShellLayoutStore.getState().setSidebarCollapsed(true);
    expect(localStorage.getItem(SHELL_LAYOUT_STORAGE_KEY)).toContain('true');
  });
});
