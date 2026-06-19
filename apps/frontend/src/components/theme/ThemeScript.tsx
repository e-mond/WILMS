import { THEME_STORAGE_KEY } from '@/constants/theme';

/**
 * Applies persisted theme before React hydrates to avoid flash and ensure
 * data-theme is present for SSR/E2E on first paint.
 */
export function ThemeScript() {
  const script = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (!stored) {
      document.documentElement.dataset.theme = 'light';
      return;
    }
    var parsed = JSON.parse(stored);
    var mode =
      parsed && parsed.state && parsed.state.mode === 'dark' ? 'dark' : 'light';
    var root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.dataset.theme = mode;
  } catch (error) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
