/**
 * Safely create a preview URL for uploads — accepts File/Blob or an existing HTTP URL.
 */
export function resolveMediaPreviewUrl(source: unknown): string | null {
  if (!source) {
    return null;
  }

  if (typeof source === 'string') {
    const trimmed = source.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof Blob !== 'undefined' && source instanceof Blob && source.size > 0) {
    return URL.createObjectURL(source);
  }

  return null;
}

export function isRevocableObjectUrl(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith('blob:'));
}
