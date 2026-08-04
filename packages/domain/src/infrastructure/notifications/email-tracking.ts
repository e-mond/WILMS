import { createHash, randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { env } from '../../config/env.js';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { emailTrackingEvents } from '../../db/schema/communication-platform.js';
import { messageDeliveries } from '../../db/schema/message-deliveries.js';

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

function trackingBaseUrl(): string {
  return (env.appUrl ?? 'https://wilms.vercel.app').replace(/\/$/, '');
}

export function generateTrackingToken(): string {
  return randomBytes(24).toString('hex');
}

export function hashTrackingToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function injectEmailTracking(html: string, trackingToken: string): string {
  const base = trackingBaseUrl();
  const pixelUrl = `${base}/api/t/o/${trackingToken}.gif`;

  let tracked = html.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
    (match, before, href, after) => {
      if (href.startsWith('mailto:') || href.includes('/api/t/c/')) {
        return match;
      }
      const linkId = createHash('sha256').update(href).digest('hex').slice(0, 12);
      const clickUrl = `${base}/api/t/c/${trackingToken}/${linkId}?url=${encodeURIComponent(href)}`;
      return `<a ${before}href="${clickUrl}"${after}>`;
    },
  );

  if (!tracked.includes(pixelUrl)) {
    tracked += `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`;
  }

  return tracked;
}

function detectDevice(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

export async function recordEmailOpen(input: {
  trackingToken: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<void> {
  if (!isDatabaseEnabled()) return;

  const db = getDb();
  const now = new Date();

  const [delivery] = await db
    .select()
    .from(messageDeliveries)
    .where(eq(messageDeliveries.trackingToken, input.trackingToken))
    .limit(1);

  if (!delivery) return;

  await db.insert(emailTrackingEvents).values({
    id: uuidv7(),
    deliveryId: delivery.id,
    eventType: 'OPEN',
    userAgent: input.userAgent ?? null,
    ipAddress: input.ipAddress ?? null,
    deviceType: detectDevice(input.userAgent),
  });

  await db
    .update(messageDeliveries)
    .set({
      openedAt: delivery.openedAt ?? now,
      firstOpenedAt: delivery.firstOpenedAt ?? now,
      openCount: sql`${messageDeliveries.openCount} + 1`,
      status: delivery.status === 'SENT' ? 'OPENED' : delivery.status,
    })
    .where(eq(messageDeliveries.id, delivery.id));
}

export async function recordEmailClick(input: {
  trackingToken: string;
  linkId: string;
  destinationUrl: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<string> {
  if (isDatabaseEnabled()) {
    const db = getDb();
    const now = new Date();

    const [delivery] = await db
      .select()
      .from(messageDeliveries)
      .where(eq(messageDeliveries.trackingToken, input.trackingToken))
      .limit(1);

    if (delivery) {
      await db.insert(emailTrackingEvents).values({
        id: uuidv7(),
        deliveryId: delivery.id,
        eventType: 'CLICK',
        linkId: input.linkId,
        destinationUrl: input.destinationUrl,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        deviceType: detectDevice(input.userAgent),
      });

      await db
        .update(messageDeliveries)
        .set({
          clickedAt: delivery.clickedAt ?? now,
          clickCount: sql`${messageDeliveries.clickCount} + 1`,
        })
        .where(eq(messageDeliveries.id, delivery.id));
    }
  }

  return input.destinationUrl;
}

export function getTrackingPixel(): Buffer {
  return TRANSPARENT_GIF;
}

export async function updateDeliveryFromWebhook(input: {
  providerMessageId: string;
  status: 'DELIVERED' | 'BOUNCED' | 'COMPLAINED' | 'FAILED' | 'DEFERRED';
  reason?: string;
}): Promise<void> {
  if (!isDatabaseEnabled()) return;

  const db = getDb();
  const now = new Date();

  const [delivery] = await db
    .select()
    .from(messageDeliveries)
    .where(eq(messageDeliveries.providerMessageId, input.providerMessageId))
    .limit(1);

  if (!delivery) return;

  const updates: Partial<typeof messageDeliveries.$inferInsert> = {
    status: input.status,
  };

  if (input.status === 'DELIVERED') {
    updates.deliveredAt = now;
    updates.success = true;
  }
  if (input.status === 'BOUNCED') {
    updates.bouncedAt = now;
    updates.bounceReason = input.reason ?? 'Bounced';
    updates.success = false;
  }
  if (input.status === 'COMPLAINED') {
    updates.complainedAt = now;
    updates.success = false;
  }
  if (input.status === 'FAILED') {
    updates.failureReason = input.reason ?? 'Failed';
    updates.success = false;
  }

  await db.update(messageDeliveries).set(updates).where(eq(messageDeliveries.id, delivery.id));
}
