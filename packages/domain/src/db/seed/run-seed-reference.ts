import '../../config/load-env.js';
import { eq } from 'drizzle-orm';
import { PERMISSION, USER_ROLE, getPermissionsForRole } from '@wilms/shared-rbac';
import { isDatabaseEnabled, getDb } from '../client.js';
import { permissions, rolePermissions, roles, userRoles } from '../schema/rbac.js';
import { collectors, users as usersTable } from '../schema/users.js';
import { DEMO_USERS } from '../../seed/demo-users.js';
import { shouldSeedDemoUsers } from '../../lib/demo-accounts.js';
import { hashPassword } from '../../lib/password.js';
import { seedAdjustmentReasons } from './seed-adjustments.js';
import { uuidv7 } from 'uuidv7';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROLE_SEED = [
  { id: '01930000-0001-7000-8000-000000000001', name: 'Super Admin', role: USER_ROLE.SUPER_ADMIN },
  { id: '01930000-0001-7000-8000-000000000002', name: 'Collector', role: USER_ROLE.COLLECTOR },
  {
    id: '01930000-0001-7000-8000-000000000003',
    name: 'Registration Officer',
    role: USER_ROLE.REGISTRATION_OFFICER,
  },
  { id: '01930000-0001-7000-8000-000000000004', name: 'Approver', role: USER_ROLE.APPROVER },
  { id: '01930000-0001-7000-8000-000000000005', name: 'Auditor', role: USER_ROLE.AUDITOR },
] as const;

async function seedRbac(): Promise<void> {
  const db = getDb();

  const permissionRows = Object.values(PERMISSION).map((id) => ({
    id,
    label: id,
    description: id,
    category: 'System',
  }));

  await db.insert(permissions).values(permissionRows).onConflictDoNothing();

  for (const roleSeed of ROLE_SEED) {
    await db
      .insert(roles)
      .values({
        id: roleSeed.id,
        name: roleSeed.name,
        description: roleSeed.name,
        isSystem: true,
      })
      .onConflictDoNothing();

    const permissionIds = [...getPermissionsForRole(roleSeed.role)];
    if (permissionIds.length > 0) {
      await db
        .insert(rolePermissions)
        .values(
          permissionIds.map((permissionId) => ({
            roleId: roleSeed.id,
            permissionId,
          })),
        )
        .onConflictDoNothing();
    }
  }

  if (!shouldSeedDemoUsers()) {
    console.log('[seed] Skipping demo users in production (set ALLOW_DEMO_SEED=true to override).');
    return;
  }

  for (const user of DEMO_USERS) {
    const userId = uuidv7();
    const passwordHash = await hashPassword(user.password);
    await db
      .insert(usersTable)
      .values({
        id: userId,
        email: user.email.toLowerCase(),
        passwordHash,
        displayName: user.displayName,
        role: user.role,
        status: 'ACTIVE',
      })
      .onConflictDoUpdate({
        target: usersTable.email,
        set: {
          passwordHash,
          displayName: user.displayName,
          role: user.role,
          updatedAt: new Date(),
        },
      });

    const [inserted] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, user.email.toLowerCase()))
      .limit(1);

    const roleRecord = ROLE_SEED.find((entry) => entry.role === user.role);
    if (roleRecord && inserted) {
      await db
        .insert(userRoles)
        .values({ userId: inserted.id, roleId: roleRecord.id })
        .onConflictDoNothing();
    }

    if (user.role === USER_ROLE.COLLECTOR && inserted) {
      await db
        .insert(collectors)
        .values({
          id: uuidv7(),
          userId: inserted.id,
          collectorCode: 'COL-001',
          assignedRegion: 'Greater Accra',
          status: 'ACTIVE',
          joinedAt: new Date(),
          lastActiveAt: new Date(),
        })
        .onConflictDoNothing();
    }
  }
}

export async function seedReferenceData(): Promise<void> {
  await seedRbac();
  await seedAdjustmentReasons();
}

async function main(): Promise<void> {
  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL is required to run seed.');
    process.exit(1);
  }

  await seedReferenceData();
  console.log('Database seed completed (RBAC + adjustment reasons).');
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
