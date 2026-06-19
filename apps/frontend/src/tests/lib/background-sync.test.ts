import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PWA_PAYMENT_SYNC_TAG } from '@/constants/pwa';
import { requestPaymentBackgroundSync } from '@/lib/pwa/background-sync';

describe('requestPaymentBackgroundSync', () => {
  const register = vi.fn();

  beforeEach(() => {
    register.mockReset();
    register.mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          sync: { register },
        }),
      },
    });
  });

  it('registers the payment sync tag when Background Sync is available', async () => {
    await expect(requestPaymentBackgroundSync()).resolves.toBe(true);
    expect(register).toHaveBeenCalledWith(PWA_PAYMENT_SYNC_TAG);
  });

  it('returns false when Background Sync is unavailable', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({}),
      },
    });

    await expect(requestPaymentBackgroundSync()).resolves.toBe(false);
  });

  it('returns false when service workers are unsupported', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: undefined,
    });

    await expect(requestPaymentBackgroundSync()).resolves.toBe(false);
  });
});
