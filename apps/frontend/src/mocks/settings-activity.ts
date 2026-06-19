import type { SettingsActivityEntry } from '@/types/settings';

export const MOCK_SETTINGS_ACTIVITY: SettingsActivityEntry[] = [
  {
    id: 'settings-activity-1',
    title: 'Admin fee updated',
    occurredAt: '2026-06-08',
    actorLabel: 'Super Admin',
  },
  {
    id: 'settings-activity-2',
    title: 'SMS sender ID verified',
    occurredAt: '2026-06-05',
    actorLabel: 'System',
  },
];
