'use client';

import { usePathname } from 'next/navigation';
import { resolveShellPageDescription } from '@/utils/shell-page-description';

export function useShellPageDescription(): string | undefined {
  const pathname = usePathname();
  return resolveShellPageDescription(pathname);
}
