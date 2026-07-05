import { desc, eq, like } from 'drizzle-orm';
import { formatDisbursementDisplayId } from '@wilms/shared-utils';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { loanDisbursements } from '../db/schema/loan-disbursements.js';

async function allocateDisbursementDisplayId(
  disbursedAt: Date,
  tx: WilmsDb,
): Promise<string> {
  const year = disbursedAt.getUTCFullYear().toString();
  const prefix = `DIS-${year}-`;
  const [latest] = await tx
    .select({ displayId: loanDisbursements.displayId })
    .from(loanDisbursements)
    .where(like(loanDisbursements.displayId, `${prefix}%`))
    .orderBy(desc(loanDisbursements.displayId))
    .limit(1);

  const lastSequence = latest?.displayId
    ? Number.parseInt(latest.displayId.slice(-6), 10)
    : 0;

  return formatDisbursementDisplayId({
    disbursedAt: disbursedAt.toISOString(),
    sequence: Number.isFinite(lastSequence) ? lastSequence + 1 : 1,
  });
}

export async function insertDisbursement(
  input: {
    loanId: string;
    amountDecimal: string;
    disbursedByUserId: string;
    idempotencyKeyId?: string;
  },
  tx: WilmsDb = getDb(),
) {
  const disbursedAt = new Date();
  const displayId = await allocateDisbursementDisplayId(disbursedAt, tx);

  const [row] = await tx
    .insert(loanDisbursements)
    .values({
      id: uuidv7(),
      displayId,
      loanId: input.loanId,
      disbursedAmount: input.amountDecimal,
      disbursedByUserId: input.disbursedByUserId,
      disbursedAt,
      idempotencyKeyId: input.idempotencyKeyId ?? null,
    })
    .returning();

  return row!;
}

export async function findDisbursementByLoan(loanId: string, tx: WilmsDb = getDb()) {
  const [row] = await tx
    .select()
    .from(loanDisbursements)
    .where(eq(loanDisbursements.loanId, loanId))
    .limit(1);

  return row;
}
