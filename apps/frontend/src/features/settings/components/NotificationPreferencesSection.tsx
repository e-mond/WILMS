'use client';

import { useEffect, useState } from 'react';
import { SettingsSectionCard, SettingsSettingRow } from '@/features/settings/components/SettingsSectionCard';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
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
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  quietHoursTimezone: 'Africa/Accra',
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

  async function sendTestPush() {
    if (USE_MOCK_SERVICES) {
      toast.success('Mock mode: push delivery is not sent.');
      return;
    }
    try {
      const result = await notificationPreferencesService.sendTestPush();
      toast.success(`Test push sent (${result.sent} device${result.sent === 1 ? '' : 's'}).`);
    } catch {
      toast.error(
        'Could not send a test push. Enable browser notifications for this account, then try again.',
      );
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
      <PushSubscribePrompt autoEnableWhenGranted />
      <div className="flex flex-wrap items-center justify-between gap-wilms-2 border-b border-border/60 pb-wilms-3">
        <div>
          <p className="text-small font-semibold text-text-primary">Test Web Push</p>
          <p className="text-xs text-text-muted">
            Sends a probe notification to this browser after you enable push above.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void sendTestPush()}>
          Send test push
        </Button>
      </div>
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
      <SettingsSettingRow
        title="Quiet hours"
        description="Suppress non-critical push during local quiet hours (Africa/Accra by default)."
        control={
          <Switch
            checked={Boolean(prefs.quietHoursEnabled)}
            label="Quiet hours"
            onChange={(value) => update('quietHoursEnabled', value)}
          />
        }
      />
      {prefs.quietHoursEnabled ? (
        <div className="grid gap-wilms-3 sm:grid-cols-2">
          <label className="space-y-wilms-1 text-small text-text-muted">
            Starts
            <Input
              type="time"
              value={prefs.quietHoursStart ?? '22:00'}
              onChange={(event) => update('quietHoursStart', event.target.value)}
              aria-label="Quiet hours start"
            />
          </label>
          <label className="space-y-wilms-1 text-small text-text-muted">
            Ends
            <Input
              type="time"
              value={prefs.quietHoursEnd ?? '07:00'}
              onChange={(event) => update('quietHoursEnd', event.target.value)}
              aria-label="Quiet hours end"
            />
          </label>
        </div>
      ) : null}
      <div className="flex justify-end pt-wilms-2">
        <Button type="button" size="sm" onClick={() => void save()}>
          Save preferences
        </Button>
      </div>
    </SettingsSectionCard>
  );
}
