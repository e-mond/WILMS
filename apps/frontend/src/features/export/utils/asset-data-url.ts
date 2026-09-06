import { WILMS_BRAND_LOGO_PATH } from '@/features/export/constants/branding';

/**
 * Resolve a same-origin public asset (or remote URL) to a data URL so PDF/print
 * iframes never depend on relative path resolution or dark-theme CSS.
 */
export async function resolveAssetDataUrl(url: string | null | undefined): Promise<string | null> {
  const trimmed = url?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const absolute =
      trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')
        ? trimmed
        : new URL(trimmed, window.location.origin).toString();

    const response = await fetch(absolute, { credentials: 'same-origin' });
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function resolveWilmsBrandLogoDataUrl(): Promise<string | null> {
  return resolveAssetDataUrl(WILMS_BRAND_LOGO_PATH);
}

export function absolutePublicAssetUrl(path: string): string {
  if (typeof window === 'undefined') {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}
