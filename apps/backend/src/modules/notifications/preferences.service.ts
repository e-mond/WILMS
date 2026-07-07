import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { userNotificationPreferences } from '../../db/schema/communication-platform.js';

export interface NotificationPreferencesDto {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  marketingEnabled: boolean;
  announcementsEnabled: boolean;
  remindersEnabled: boolean;
  loanNotifications: boolean;
  paymentNotifications: boolean;
  approvalNotifications: boolean;
  registrationNotifications: boolean;
  digestFrequency: 'INSTANT' | 'DAILY' | 'WEEKLY';
}

const DEFAULTS: NotificationPreferencesDto = {
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

const memoryPrefs = new Map<string, NotificationPreferencesDto>();

function mapRow(row: typeof userNotificationPreferences.$inferSelect): NotificationPreferencesDto {
  return {
    emailEnabled: row.emailEnabled,
    smsEnabled: row.smsEnabled,
    pushEnabled: row.pushEnabled,
    inAppEnabled: row.inAppEnabled,
    marketingEnabled: row.marketingEnabled,
    announcementsEnabled: row.announcementsEnabled,
    remindersEnabled: row.remindersEnabled,
    loanNotifications: row.loanNotifications,
    paymentNotifications: row.paymentNotifications,
    approvalNotifications: row.approvalNotifications,
    registrationNotifications: row.registrationNotifications,
    digestFrequency: row.digestFrequency as NotificationPreferencesDto['digestFrequency'],
  };
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferencesDto> {
  if (!isDatabaseEnabled()) {
    return memoryPrefs.get(userId) ?? { ...DEFAULTS };
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, userId))
    .limit(1);

  if (!row) {
    return { ...DEFAULTS };
  }

  return mapRow(row);
}

export async function updateNotificationPreferences(
  userId: string,
  input: Partial<NotificationPreferencesDto>,
): Promise<NotificationPreferencesDto> {
  const merged = { ...(await getNotificationPreferences(userId)), ...input };

  if (!isDatabaseEnabled()) {
    memoryPrefs.set(userId, merged);
    return merged;
  }

  const db = getDb();
  await db
    .insert(userNotificationPreferences)
    .values({
      userId,
      ...merged,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userNotificationPreferences.userId,
      set: {
        ...merged,
        updatedAt: new Date(),
      },
    });

  return merged;
}

export async function shouldSendChannel(
  userId: string,
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP',
  category?: 'marketing' | 'announcement' | 'reminder' | 'loan' | 'payment' | 'approval' | 'registration',
): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId);

  if (channel === 'EMAIL' && !prefs.emailEnabled) return false;
  if (channel === 'SMS' && !prefs.smsEnabled) return false;
  if (channel === 'PUSH' && !prefs.pushEnabled) return false;
  if (channel === 'IN_APP' && !prefs.inAppEnabled) return false;

  if (category === 'marketing' && !prefs.marketingEnabled) return false;
  if (category === 'announcement' && !prefs.announcementsEnabled) return false;
  if (category === 'reminder' && !prefs.remindersEnabled) return false;
  if (category === 'loan' && !prefs.loanNotifications) return false;
  if (category === 'payment' && !prefs.paymentNotifications) return false;
  if (category === 'approval' && !prefs.approvalNotifications) return false;
  if (category === 'registration' && !prefs.registrationNotifications) return false;

  return true;
}
