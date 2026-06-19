import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorTracking } from '@/services/errorTracking';
import type { ErrorTrackingProvider } from '@/types/observability';

describe('errorTracking', () => {
  afterEach(() => {
    errorTracking.resetProvider();
  });

  it('routes exceptions and messages through the active provider', () => {
    const provider: ErrorTrackingProvider = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      setUser: vi.fn(),
    };

    errorTracking.setProvider(provider);

    const error = new Error('Payment failed');
    errorTracking.captureException(error, { borrowerId: 'b-1' });
    errorTracking.captureMessage('GPS denied', 'warning', { feature: 'payment' });
    errorTracking.setUser({ id: 'user-1', role: 'COLLECTOR' });

    expect(provider.captureException).toHaveBeenCalledWith(error, {
      borrowerId: 'b-1',
    });
    expect(provider.captureMessage).toHaveBeenCalledWith('GPS denied', 'warning', {
      feature: 'payment',
    });
    expect(provider.setUser).toHaveBeenCalledWith({
      id: 'user-1',
      role: 'COLLECTOR',
    });
  });
});
