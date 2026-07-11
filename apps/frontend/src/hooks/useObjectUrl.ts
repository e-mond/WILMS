'use client';

import { useEffect, useState } from 'react';
import { isRevocableObjectUrl, resolveMediaPreviewUrl } from '@/utils/media-preview';

export function useObjectUrl(file: File | string | null | undefined): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const preview = resolveMediaPreviewUrl(file);
    setObjectUrl(preview);

    if (!preview || !isRevocableObjectUrl(preview)) {
      return;
    }

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [file]);

  return objectUrl;
}
