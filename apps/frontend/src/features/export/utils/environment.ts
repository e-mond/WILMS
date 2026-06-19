import type { WilmsEnvironment } from '@/features/export/types';

export function getWilmsEnvironment(): WilmsEnvironment {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_WILMS_ENV === 'staging' ? 'Staging' : 'Production';
  }

  return 'Development';
}
