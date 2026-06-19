'use client';

import { usePathname } from 'next/navigation';
import { resolveShellPageTitle } from '@/utils/shell-page-title';

export function useShellPageTitle(): string {
  const pathname = usePathname();
  return resolveShellPageTitle(pathname);
}
