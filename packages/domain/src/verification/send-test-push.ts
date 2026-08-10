/**
 * One-shot Web Push delivery probe against the configured DATABASE_URL + VAPID keys.
 *
 * Usage (from repo root):
 *   set -a && source apps/backend/.env.local && set +a
 *   npx tsx packages/domain/src/verification/send-test-push.ts [userId]
 */
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { desc, sql } from 'drizzle-orm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
for (const rel of ['apps/backend/.env.local', '.env.local', '.env']) {
  const candidate = path.join(root, rel);
  if (existsSync(candidate)) {
    config({ path: candidate, override: false });
  }
}

const { getDb, isDatabaseEnabled } = await import('../db/client.js');
const { pushSubscriptions } = await import('../db/schema/communication-platform.js');
const { sendPushToUser } = await import('../modules/notifications/push.service.js');

async function main() {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL is required');
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY?.trim();
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY?.trim();
  console.log('VAPID configured:', Boolean(vapidPublic && vapidPrivate));

  const db = getDb();
  const requestedUserId = process.argv[2]?.trim();

  let userId = requestedUserId;
  if (!userId) {
    const [row] = await db
      .select({
        userId: pushSubscriptions.userId,
        endpoint: pushSubscriptions.endpoint,
      })
      .from(pushSubscriptions)
      .orderBy(desc(pushSubscriptions.updatedAt))
      .limit(1);
    if (!row) {
      console.error(
        'No push subscriptions found. Open WILMS in a browser, enable notifications, then re-run.',
      );
      process.exit(2);
    }
    userId = row.userId;
    console.log('Using latest subscription userId:', userId);
    console.log('Endpoint host:', (() => {
      try {
        return new URL(row.endpoint).host;
      } catch {
        return '(invalid endpoint)';
      }
    })());
  }

  const count = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM push_subscriptions
    WHERE user_id = ${userId}
  `);
  console.log('Subscriptions for user:', (count.rows[0] as { count: number }).count);

  const result = await sendPushToUser(userId, {
    title: 'WILMS test push',
    body: `Probe at ${new Date().toISOString()} — if you see this, Web Push is working.`,
    url: '/dashboard',
    category: 'announcement',
    critical: true,
  });

  console.log('sendPushToUser result:', result);
  if (result.skipped) {
    console.error('Push skipped by preferences/quiet hours.');
    process.exit(3);
  }
  if (result.sent === 0) {
    console.error('No notifications sent. Check VAPID keys and subscription validity.');
    process.exit(4);
  }
  console.log('OK — delivered to at least one endpoint.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
