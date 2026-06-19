import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { ledgerEntries } from '../db/schema/ledger-entries.js';

export async function appendLedgerEntry(
  input: {
    entryType: 'LOAN_DISBURSEMENT' | 'REPAYMENT' | 'INTEREST_CHARGE' | 'PENALTY_CHARGE';
    loanId?: string;
    borrowerId?: string;
    paymentId?: string;
    amountDecimal: string;
    description?: string;
    actorUserId?: string;
    metadata?: Record<string, unknown>;
  },
  tx: WilmsDb = getDb(),
) {
  const [row] = await tx
    .insert(ledgerEntries)
    .values({
      id: uuidv7(),
      entryType: input.entryType,
      loanId: input.loanId ?? null,
      borrowerId: input.borrowerId ?? null,
      paymentId: input.paymentId ?? null,
      amount: input.amountDecimal,
      currencyCode: 'GHS',
      description: input.description ?? null,
      actorUserId: input.actorUserId ?? null,
      metadata: input.metadata ?? null,
      recordedAt: new Date(),
    })
    .returning();

  return row!;
}

export async function listLedgerForLoan(loanId: string, tx: WilmsDb = getDb()) {
  const { eq } = await import('drizzle-orm');
  return tx.select().from(ledgerEntries).where(eq(ledgerEntries.loanId, loanId));
}
