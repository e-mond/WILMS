import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LogProvider } from '@/types/observability';
import { logger } from '@/utils/logger';

describe('logger', () => {
  afterEach(() => {
    logger.resetProvider();
  });

  it('routes log calls through the active provider', () => {
    const provider: LogProvider = {
      log: vi.fn(),
    };

    logger.setProvider(provider);
    logger.info('Payment recorded', { borrowerId: 'b-1' });

    expect(provider.log).toHaveBeenCalledWith('info', 'Payment recorded', {
      borrowerId: 'b-1',
    });
  });

  it('supports all log levels', () => {
    const provider: LogProvider = {
      log: vi.fn(),
    };

    logger.setProvider(provider);
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(provider.log).toHaveBeenCalledTimes(4);
  });

  it('uses a no-op provider in test environment by default', () => {
    const provider: LogProvider = {
      log: vi.fn(),
    };

    logger.resetProvider();
    logger.info('silent in test');

    expect(provider.log).not.toHaveBeenCalled();
  });
});
