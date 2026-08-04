/**
 * P14.3B Phase 4C.4 — Shared certification helpers for reconciliation.
 */
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { auditEntries } from '../db/schema/audit.js';
import { groupMembers, groups } from '../db/schema/groups.js';
import { loans } from '../db/schema/loans.js';
import { users } from '../db/schema/users.js';
import * as loanRepo from '../repositories/loan.repository.js';

export const CERT_RECONCILIATION_GROUP_ID = '01930004-0001-7000-8000-000000000001';
const CERT_BORROWER_IDS = [
  '01930001-0001-7000-8000-000000000001',
  '01930001-0001-7000-8000-000000000002',
  '01930001-0001-7000-8000-000000000004',
] as const;

export const DEMO_ADMIN_EMAIL = 'admin@wilms.demo';
export const DEMO_COLLECTOR_EMAIL = 'collector@wilms.demo';
export const DEMO_OFFICER_EMAIL = 'officer@wilms.demo';

/** Tuesday — matches seed loan 01930002-...-0004 paymentDay. */
export const CERT_TUESDAY_DATE = '2030-01-01';

export function certDateForIndex(index: number): string {
  const base = new Date(`${CERT_TUESDAY_DATE}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + index);
  return base.toISOString().slice(0, 10);
}

export async function resolveCertActors() {
  const db = getDb();
  const [admin] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.email, DEMO_ADMIN_EMAIL))
    .limit(1);
  const [collector] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.email, DEMO_COLLECTOR_EMAIL))
    .limit(1);
  if (!admin || !collector) {
    throw new Error('Demo users missing — run db:seed');
  }
  return {
    adminId: admin.id,
    adminDisplayName: admin.displayName,
    collectorId: collector.id,
    collectorDisplayName: collector.displayName,
  };
}

/**
 * Certification tooling: seed does not assign groups to the demo collector.
 * Ensures portfolio loans are visible via group membership without changing product seed.
 */
export async function ensureCertCollectorPortfolio(collectorId: string): Promise<number> {
  const existing = await loanRepo.listPortfolioLoansForCollector(collectorId);
  if (existing.length > 0) {
    return existing.length;
  }

  const db = getDb();
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, CERT_RECONCILIATION_GROUP_ID))
    .limit(1);

  if (!group) {
    await db.insert(groups).values({
      id: CERT_RECONCILIATION_GROUP_ID,
      systemId: 'CERT-REC-001',
      name: 'Cert Reconciliation Group',
      displayName: 'Cert Reconciliation Group',
      community: 'Accra',
      status: 'ACTIVE',
      collectorUserId: collectorId,
      formedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  } else if (group.collectorUserId !== collectorId) {
    await db
      .update(groups)
      .set({ collectorUserId: collectorId, updatedAt: new Date() })
      .where(eq(groups.id, CERT_RECONCILIATION_GROUP_ID));
  }

  const activeBorrowers = await db
    .select({ borrowerId: loans.borrowerId })
    .from(loans)
    .where(
      and(
        inArray(loans.borrowerId, [...CERT_BORROWER_IDS]),
        isNull(loans.deletedAt),
        eq(loans.externalStatus, 'ACTIVE'),
      ),
    );

  for (const { borrowerId } of activeBorrowers) {
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, CERT_RECONCILIATION_GROUP_ID),
          eq(groupMembers.borrowerId, borrowerId),
        ),
      )
      .limit(1);

    if (!member) {
      await db.insert(groupMembers).values({
        groupId: CERT_RECONCILIATION_GROUP_ID,
        borrowerId,
        role: 'MEMBER',
      });
    }
  }

  const portfolio = await loanRepo.listPortfolioLoansForCollector(collectorId);
  return portfolio.length;
}

export async function waitForAuditEntry(
  targetEntityId: string,
  options: { action?: string; timeoutMs?: number } = {},
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const deadline = Date.now() + timeoutMs;
  const db = getDb();

  while (Date.now() < deadline) {
    const rows = await db.select().from(auditEntries).where(eq(auditEntries.targetEntityId, targetEntityId));
    const match = options.action
      ? rows.find((row) => row.action === options.action)
      : rows[0];
    if (match) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
