import { eq } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { users } from '../db/schema/users.js';
import type { DemoUser } from '../seed/demo-users.js';

export async function findUserByEmail(email: string): Promise<DemoUser | undefined> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const rows = await db.select().from(users);
  const row = rows.find((entry) => entry.email.toLowerCase() === normalized);

  if (!row || row.deletedAt) {
    return undefined;
  }

  return {
    id: row.id,
    email: row.email,
    password: row.passwordHash,
    role: row.role,
    displayName: row.displayName,
    status: row.status,
  };
}

export async function updateLastLoginAt(userId: string): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function upsertDemoUser(user: DemoUser & { passwordHash?: string }): Promise<void> {
  const db = getDb();
  await db
    .insert(users)
    .values({
      id: user.id,
      email: user.email.toLowerCase(),
      passwordHash: user.passwordHash ?? user.password,
      displayName: user.displayName,
      role: user.role,
      status: 'ACTIVE',
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: user.email.toLowerCase(),
        passwordHash: user.passwordHash ?? user.password,
        displayName: user.displayName,
        role: user.role,
        updatedAt: new Date(),
      },
    });
}

export async function getUserById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? undefined;
}
