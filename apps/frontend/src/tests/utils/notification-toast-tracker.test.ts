import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSeenNotificationIds,
  loadSeenNotificationIds,
  persistSeenNotificationIds,
} from '@/utils/notification-toast-tracker';

describe('notification-toast-tracker', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('persists and reloads seen notification ids', () => {
    const ids = new Set(['n-1', 'n-2']);
    persistSeenNotificationIds('user-1', ids);

    expect(loadSeenNotificationIds('user-1')).toEqual(new Set(['n-1', 'n-2']));
  });

  it('clears seen notification ids for a user', () => {
    persistSeenNotificationIds('user-1', new Set(['n-1']));
    clearSeenNotificationIds('user-1');

    expect(loadSeenNotificationIds('user-1')).toEqual(new Set());
  });
});
