'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { resolveShellPageTitle } from '@/utils/shell-page-title';

export function useShellPageTitle(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return resolveShellPageTitle(pathname, searchParams.toString());
}
