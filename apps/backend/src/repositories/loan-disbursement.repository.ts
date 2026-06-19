import { uuidv7 } from 'uuidv7';
import { and, eq } from 'drizzle-orm';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { loanDisbursements } from '../db/schema/loan-disbursements.js';

export async function insertDisbursement(
  input: {
    loanId: string;
    amountDecimal: string;
    disbursedByUserId: string;
    idempotencyKeyId?: string;
  },
  tx: WilmsDb = getDb(),
) {
  const [row] = await tx
    .insert(loanDisbursements)
    .values({
      id: uuidv7(),
      loanId: input.loanId,
      disbursedAmount: input.amountDecimal,
      disbursedByUserId: input.disbursedByUserId,
      disbursedAt: new Date(),
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
