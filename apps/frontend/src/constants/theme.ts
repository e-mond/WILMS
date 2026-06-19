export const THEME_MODE = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export type ThemeMode = (typeof THEME_MODE)[keyof typeof THEME_MODE];

export const THEME_STORAGE_KEY = 'wilms-theme-mode';
