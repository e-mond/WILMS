import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as PreferencesService from '../../modules/notifications/preferences.service.js';
import type * as PushService from '../../modules/notifications/push.service.js';

type ShouldSendChannel = typeof PreferencesService.shouldSendChannel;
type ShouldSendChannelArgs = Parameters<ShouldSendChannel>;
type SendPushToUser = typeof PushService.sendPushToUser;
type SendPushArgs = Parameters<SendPushToUser>;

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => false,
  getDb: () => ({}),
}));

const shouldSendChannel = vi.fn(async (..._args: ShouldSendChannelArgs): Promise<boolean> => true);
const sendPushToUser = vi.fn(
  async (..._args: SendPushArgs): Promise<{ sent: number; failed: number }> => ({
    sent: 0,
    failed: 0,
  }),
);

vi.mock('../../modules/notifications/preferences.service.js', () => ({
  shouldSendChannel: (...args: ShouldSendChannelArgs) => shouldSendChannel(...args),
}));

vi.mock('../../modules/notifications/push.service.js', () => ({
  sendPushToUser: (...args: SendPushArgs) => sendPushToUser(...args),
}));

describe('createInAppNotification mirrors Web Push', () => {
  beforeEach(() => {
    shouldSendChannel.mockReset();
    shouldSendChannel.mockResolvedValue(true);
    sendPushToUser.mockReset();
    sendPushToUser.mockResolvedValue({ sent: 0, failed: 0 });
  });

  it('sends push after a successful in-app write when preferences allow IN_APP', async () => {
    const { createInAppNotification } = await import(
      '../../infrastructure/notifications/in-app-notify.js'
    );

    await createInAppNotification({
      userId: 'user-1',
      event: 'PAYMENT_RECEIVED',
      title: 'Payment recorded',
      body: 'GH₵50.00 received',
      href: '/collector/dashboard',
    });

    expect(shouldSendChannel).toHaveBeenCalledWith('user-1', 'IN_APP', 'payment', {
      critical: false,
    });
    expect(sendPushToUser).toHaveBeenCalledWith('user-1', {
      title: 'Payment recorded',
      body: 'GH₵50.00 received',
      url: '/collector/dashboard',
      category: 'payment',
      critical: false,
    });
  });

  it('does not push when IN_APP preferences block creation', async () => {
    shouldSendChannel.mockResolvedValueOnce(false);
    const { createInAppNotification } = await import(
      '../../infrastructure/notifications/in-app-notify.js'
    );

    await createInAppNotification({
      userId: 'user-1',
      event: 'PAYMENT_REMINDER',
      title: 'Reminder',
      body: 'Payment due',
    });

    expect(sendPushToUser).not.toHaveBeenCalled();
  });
});
