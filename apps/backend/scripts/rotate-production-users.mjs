/**
 * Suspend demo seed users and create production accounts with random passwords.
 * Credentials written to .wilms-production-credentials.json (gitignored).
 *
 * Usage: npx tsx apps/backend/scripts/rotate-production-users.mjs
 * Requires: DATABASE_URL
 */
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq, like } from 'drizzle-orm';
import { USER_ROLE } from '@wilms/shared-rbac';
import { uuidv7 } from 'uuidv7';
import '../src/config/load-env.js';
import { getDb, isDatabaseEnabled } from '../src/db/client.js';
import { users } from '../src/db/schema/users.js';
import { hashPassword } from '../src/lib/password.js';

const PRODUCTION_ACCOUNTS = [
  { email: 'admin@wilms.production', role: USER_ROLE.SUPER_ADMIN, displayName: 'WILMS Admin' },
  { email: 'collector@wilms.production', role: USER_ROLE.COLLECTOR, displayName: 'WILMS Collector' },
  { email: 'officer@wilms.production', role: USER_ROLE.REGISTRATION_OFFICER, displayName: 'WILMS Officer' },
  { email: 'approver@wilms.production', role: USER_ROLE.APPROVER, displayName: 'WILMS Approver' },
  { email: 'auditor@wilms.production', role: USER_ROLE.AUDITOR, displayName: 'WILMS Auditor' },
];

function generatePassword(): string {
  return randomBytes(18).toString('base64url');
}

async function main(): Promise<void> {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL is required.');
  }

  const db = getDb();
  const demoUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(like(users.email, '%@wilms.demo'));

  for (const demo of demoUsers) {
    await db
      .update(users)
      .set({ status: 'SUSPENDED', updatedAt: new Date() })
      .where(eq(users.id, demo.id));
  }

  const credentials: Array<{ email: string; role: string; password: string }> = [];

  for (const account of PRODUCTION_ACCOUNTS) {
    const password = generatePassword();
    const passwordHash = await hashPassword(password);
    const userId = uuidv7();

    await db
      .insert(users)
      .values({
        id: userId,
        email: account.email,
        passwordHash,
        displayName: account.displayName,
        role: account.role,
        status: 'ACTIVE',
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash,
          status: 'ACTIVE',
          displayName: account.displayName,
          role: account.role,
          updatedAt: new Date(),
        },
      });

    credentials.push({ email: account.email, role: account.role, password });
  }

  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const outPath = path.join(repoRoot, '.wilms-production-credentials.json');
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        rotatedAt: new Date().toISOString(),
        suspendedDemoEmails: demoUsers.map((u) => u.email),
        accounts: credentials,
        deliver: 'Out of band only — never commit this file',
      },
      null,
      2,
    ),
  );

  console.log(`Suspended ${demoUsers.length} demo user(s).`);
  console.log(`Upserted ${credentials.length} production account(s).`);
  console.log(`Credentials written to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
