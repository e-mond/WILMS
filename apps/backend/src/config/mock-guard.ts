import { env } from './env.js';
import { logger } from '../infrastructure/logging/logger.js';

export function assertProductionMockDisabled(): void {
  if (env.nodeEnv !== 'production') {
    return;
  }

  const mockFlags = [
    ['NEXT_PUBLIC_USE_MOCK', process.env.NEXT_PUBLIC_USE_MOCK],
    ['NEXT_PUBLIC_DEMO_MODE', process.env.NEXT_PUBLIC_DEMO_MODE],
    ['NEXT_PUBLIC_FORCE_DEMO_MODE', process.env.NEXT_PUBLIC_FORCE_DEMO_MODE],
    ['NEXT_PUBLIC_API_DISABLED', process.env.NEXT_PUBLIC_API_DISABLED],
  ] as const;

  for (const [name, value] of mockFlags) {
    if (value === 'true') {
      logger.error('startup.mockFlagInProduction', { flag: name });
      process.exit(1);
    }
  }
}
