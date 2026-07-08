import { and, eq, isNull, sql } from 'drizzle-orm';
import { USER_ROLE } from '@wilms/shared-rbac';
import { getDb } from '../db/client.js';
import { collectors, users } from '../db/schema/users.js';
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

export async function findAnyUserByEmail(
  email: string,
): Promise<typeof users.$inferSelect | undefined> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  return row;
}

export async function updateLastLoginAt(userId: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db
    .update(users)
    .set({
      lastLoginAt: now,
      firstLoginAt: sql`COALESCE(${users.firstLoginAt}, ${now})`,
      updatedAt: now,
    })
    .where(eq(users.id, userId));
}

export async function recordInvitationAccepted(userId: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db
    .update(users)
    .set({
      acceptedAt: sql`COALESCE(${users.acceptedAt}, ${now})`,
      updatedAt: now,
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)));
}

export async function recordFirstLogin(userId: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db
    .update(users)
    .set({
      lastLoginAt: now,
      firstLoginAt: sql`COALESCE(${users.firstLoginAt}, ${now})`,
      acceptedAt: sql`COALESCE(${users.acceptedAt}, ${now})`,
      updatedAt: now,
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)));
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
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
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  return row ?? undefined;
}

export async function listUsers() {
  const db = getDb();
  return db.select().from(users).where(isNull(users.deletedAt));
}

export async function listCollectors() {
  const db = getDb();
  const collectorUsers = await db
    .select()
    .from(users)
    .where(and(eq(users.role, USER_ROLE.COLLECTOR), isNull(users.deletedAt)));

  const collectorRows = await db.select().from(collectors).where(isNull(collectors.deletedAt));
  const collectorByUserId = new Map(collectorRows.map((row) => [row.userId, row]));

  return collectorUsers.map((user) => ({
    user,
    collector: collectorByUserId.get(user.id) ?? null,
  }));
}
