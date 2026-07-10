'use client';

import { useEffect, useState } from 'react';
import { SettingsSectionCard, SettingsSettingRow } from '@/features/settings/components/SettingsSectionCard';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { USE_MOCK_SERVICES } from '@/config/api';
import notificationPreferencesService from '@/services/notificationPreferencesService';
import type { NotificationPreferences } from '@/types/notification-preferences';
import { PushSubscribePrompt } from '@/features/notifications/components/PushSubscribePrompt';
import { SettingsNotificationsIcon } from '@/features/settings/components/SettingsSectionIcons';
import { roleSettingsPreferences } from '@/features/settings/utils/role-settings-preferences';

const DEFAULTS: NotificationPreferences = {
  emailEnabled: true,
  smsEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  marketingEnabled: true,
  announcementsEnabled: true,
  remindersEnabled: true,
  loanNotifications: true,
  paymentNotifications: true,
  approvalNotifications: true,
  registrationNotifications: true,
  digestFrequency: 'INSTANT',
};

export function NotificationPreferencesSection() {
  const toast = useToast();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(!USE_MOCK_SERVICES);

  useEffect(() => {
    if (USE_MOCK_SERVICES) {
      setPrefs({
        ...DEFAULTS,
        pushEnabled: roleSettingsPreferences.getPushNotifications(),
        digestFrequency: roleSettingsPreferences.getEmailSummaries() ? 'DAILY' : 'INSTANT',
      });
      return;
    }

    void notificationPreferencesService
      .getPreferences()
      .then(setPrefs)
      .catch(() => setPrefs(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) {
    setPrefs((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (USE_MOCK_SERVICES) {
      roleSettingsPreferences.setPushNotifications(prefs.pushEnabled);
      roleSettingsPreferences.setEmailSummaries(prefs.digestFrequency !== 'INSTANT');
      toast.success('Notification preferences saved');
      return;
    }

    try {
      const saved = await notificationPreferencesService.updatePreferences(prefs);
      setPrefs(saved);
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Unable to save preferences');
    }
  }

  if (loading) {
    return null;
  }

  return (
    <SettingsSectionCard
      title="Notification Preferences"
      description="Control email, SMS, push, and in-app alerts."
      icon={<SettingsNotificationsIcon />}
    >
      <PushSubscribePrompt />
      <SettingsSettingRow
        title="Email"
        description="Receive email notifications."
        control={<Switch checked={prefs.emailEnabled} label="Email" onChange={(value) => update('emailEnabled', value)} />}
      />
      <SettingsSettingRow
        title="SMS"
        description="Receive SMS notifications."
        control={<Switch checked={prefs.smsEnabled} label="SMS" onChange={(value) => update('smsEnabled', value)} />}
      />
      <SettingsSettingRow
        title="Push"
        description="Browser push notifications."
        control={<Switch checked={prefs.pushEnabled} label="Push" onChange={(value) => update('pushEnabled', value)} />}
      />
      <SettingsSettingRow
        title="In-app"
        description="In-app notification center."
        control={<Switch checked={prefs.inAppEnabled} label="In-app" onChange={(value) => update('inAppEnabled', value)} />}
      />
      <SettingsSettingRow
        title="Marketing"
        description="Promotional messages."
        control={<Switch checked={prefs.marketingEnabled} label="Marketing" onChange={(value) => update('marketingEnabled', value)} />}
      />
      <SettingsSettingRow
        title="Announcements"
        description="System announcements."
        control={<Switch checked={prefs.announcementsEnabled} label="Announcements" onChange={(value) => update('announcementsEnabled', value)} />}
      />
      <SettingsSettingRow
        title="Reminders"
        description="Payment and task reminders."
        control={<Switch checked={prefs.remindersEnabled} label="Reminders" onChange={(value) => update('remindersEnabled', value)} />}
      />
      <SettingsSettingRow
        title="Digest frequency"
        description="How often to receive summary digests."
        control={
          <Select
            value={prefs.digestFrequency}
            onChange={(event) =>
              update('digestFrequency', event.target.value as NotificationPreferences['digestFrequency'])
            }
            aria-label="Digest frequency"
          >
            <option value="INSTANT">Instant</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </Select>
        }
      />
      <div className="flex justify-end pt-wilms-2">
        <Button type="button" size="sm" onClick={() => void save()}>
          Save preferences
        </Button>
      </div>
    </SettingsSectionCard>
  );
}
