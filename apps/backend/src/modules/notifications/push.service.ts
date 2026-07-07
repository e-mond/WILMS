import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { pushSubscriptions } from '../../db/schema/communication-platform.js';

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

const memorySubs = new Map<string, PushSubscriptionInput[]>();

export async function savePushSubscription(
  userId: string,
  input: PushSubscriptionInput,
): Promise<void> {
  if (!isDatabaseEnabled()) {
    const existing = memorySubs.get(userId) ?? [];
    memorySubs.set(userId, [...existing.filter((s) => s.endpoint !== input.endpoint), input]);
    return;
  }

  const db = getDb();
  const now = new Date();

  await db
    .insert(pushSubscriptions)
    .values({
      id: uuidv7(),
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
        updatedAt: now,
      },
    });
}

export async function removePushSubscription(userId: string, endpoint: string): Promise<void> {
  if (!isDatabaseEnabled()) {
    const existing = memorySubs.get(userId) ?? [];
    memorySubs.set(
      userId,
      existing.filter((s) => s.endpoint !== endpoint),
    );
    return;
  }

  const db = getDb();
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function listPushSubscriptionsForUser(userId: string): Promise<PushSubscriptionInput[]> {
  if (!isDatabaseEnabled()) {
    return memorySubs.get(userId) ?? [];
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  return rows.map((row) => ({
    endpoint: row.endpoint,
    keys: { p256dh: row.p256dh, auth: row.auth },
    userAgent: row.userAgent ?? undefined,
  }));
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; category?: string },
): Promise<{ sent: number; failed: number }> {
  const subs = await listPushSubscriptionsForUser(userId);
  if (subs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Web Push requires VAPID keys — log intent when not configured
  const vapidPublic = process.env.VAPID_PUBLIC_KEY?.trim();
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY?.trim();

  if (!vapidPublic || !vapidPrivate) {
    console.info(`[push] ${subs.length} subscription(s) for user ${userId}; VAPID not configured`);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      // Dynamic import to avoid hard dependency when web-push not installed
      const webpush = await import('web-push').catch(() => null);
      if (!webpush) {
        console.info('[push] web-push package not installed');
        break;
      }

      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT ?? 'mailto:support@wilms.org',
        vapidPublic,
        vapidPrivate,
      );

      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url,
          category: payload.category,
        }),
      );
      sent += 1;
    } catch (error) {
      console.error('[push] delivery failed:', error);
      failed += 1;
    }
  }

  return { sent, failed };
}
