import { env } from './env.js';
import { isServerlessRuntime } from './runtime.js';
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
      // Never process.exit in serverless — it turns every Route Handler into an opaque HTML 500.
      if (isServerlessRuntime()) {
        throw new Error(
          `Mock flag ${name}=true is not allowed in production serverless runtime.`,
        );
      }
      process.exit(1);
    }
  }
}
