import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as PreferencesService from '../../modules/notifications/preferences.service.js';

type ShouldSendChannel = typeof PreferencesService.shouldSendChannel;
type ShouldSendChannelArgs = Parameters<ShouldSendChannel>;

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => false,
  getDb: () => ({}),
}));

const shouldSendChannel = vi.fn(async (..._args: ShouldSendChannelArgs): Promise<boolean> => true);

vi.mock('../../modules/notifications/preferences.service.js', () => ({
  shouldSendChannel: (...args: ShouldSendChannelArgs) => shouldSendChannel(...args),
}));

describe('push and in-app preference gates', () => {
  beforeEach(() => {
    shouldSendChannel.mockReset();
    shouldSendChannel.mockResolvedValue(true);
  });

  it('skips push delivery when preferences disallow PUSH', async () => {
    shouldSendChannel.mockResolvedValueOnce(false);
    const { sendPushToUser } = await import('../../modules/notifications/push.service.js');
    const result = await sendPushToUser('user-1', {
      title: 'Holiday approved',
      body: 'Your request was approved',
      category: 'holiday',
    });
    expect(result).toEqual({ sent: 0, failed: 0, skipped: true });
    expect(shouldSendChannel).toHaveBeenCalledWith('user-1', 'PUSH', 'approval', {
      critical: false,
    });
  });

  it('skips in-app create when preferences disallow IN_APP', async () => {
    shouldSendChannel.mockResolvedValueOnce(false);
    const { createInAppNotification } = await import(
      '../../infrastructure/notifications/in-app-notify.js'
    );
    await expect(
      createInAppNotification({
        userId: 'user-1',
        event: 'PAYMENT_REMINDER',
        title: 'Reminder',
        body: 'Payment due',
      }),
    ).resolves.toBeUndefined();
    expect(shouldSendChannel).toHaveBeenCalledWith('user-1', 'IN_APP', 'payment', {
      critical: false,
    });
  });
});
