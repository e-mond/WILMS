import { beforeEach, describe, expect, it } from 'vitest';
import { THEME_MODE } from '@/constants/theme';
import { useThemeStore } from '@/state/themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({
      mode: THEME_MODE.LIGHT,
      isHydrated: true,
    });
  });

  it('defaults to light mode', () => {
    expect(useThemeStore.getState().mode).toBe(THEME_MODE.LIGHT);
  });

  it('sets dark mode explicitly', () => {
    useThemeStore.getState().setMode(THEME_MODE.DARK);
    expect(useThemeStore.getState().mode).toBe(THEME_MODE.DARK);
  });

  it('toggles between light and dark', () => {
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe(THEME_MODE.DARK);

    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe(THEME_MODE.LIGHT);
  });
});
