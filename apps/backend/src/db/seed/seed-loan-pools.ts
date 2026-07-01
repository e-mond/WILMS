import { eq } from 'drizzle-orm';
import { assertPoolBalanceIntegrity, derivePoolAggregates } from '../../domain/loan-pool/balance.js';
import { getDb, runInTransaction } from '../client.js';
import { loanPools } from '../schema/loan-pools.js';
import { loans } from '../schema/loans.js';
import * as poolRepo from '../../repositories/loan-pool.repository.js';

const POOL_SEED = [
  {
    id: '01930003-0001-7000-8000-000000000001',
    name: 'Accra Metro Pool',
    region: 'Greater Accra',
    source: 'MiDA Grant',
    capitalPesewas: 180_000_000,
    cycleLabel: 'C5',
    lastReplenishedAt: new Date('2026-03-01T00:00:00.000Z'),
    groupCount: 1,
    loanLinks: [
      { loanId: '01930002-0001-7000-8000-000000000001', disbursedPesewas: 50000, collectedPesewas: 15000 },
      { loanId: '01930002-0001-7000-8000-000000000002', disbursedPesewas: 24000, collectedPesewas: 24000 },
    ],
  },
  {
    id: '01930003-0001-7000-8000-000000000002',
    name: 'Ashanti Revolving Fund',
    region: 'Ashanti',
    source: 'GIZ Contribution',
    capitalPesewas: 120_000_000,
    cycleLabel: 'C4',
    lastReplenishedAt: new Date('2026-04-12T00:00:00.000Z'),
    groupCount: 1,
    loanLinks: [
      { loanId: '01930002-0001-7000-8000-000000000004', disbursedPesewas: 48000, collectedPesewas: 16000 },
    ],
  },
  {
    id: '01930003-0001-7000-8000-000000000003',
    name: 'Northern Resilience Pool',
    region: 'Northern',
    source: 'USAID',
    capitalPesewas: 95_000_000,
    cycleLabel: 'C3',
    lastReplenishedAt: new Date('2026-02-18T00:00:00.000Z'),
    groupCount: 0,
    loanLinks: [] as { loanId: string; disbursedPesewas: number; collectedPesewas: number }[],
  },
] as const;

/**
 * Seeds loan pools with allocation rows that reconcile to stored aggregates.
 * Idempotent: skips pools that already exist by fixed UUID.
 */
export async function seedLoanPools(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error(
      'Demo loan pool seed is disabled in production. Set ALLOW_DEMO_SEED=true to override.',
    );
  }

  const db = getDb();

  for (const poolSeed of POOL_SEED) {
    const existing = await poolRepo.findPoolById(poolSeed.id);
    if (existing) {
      continue;
    }

    const disbursedPesewas = poolSeed.loanLinks.reduce((sum, link) => sum + link.disbursedPesewas, 0);
    const collectedPesewas = poolSeed.loanLinks.reduce((sum, link) => sum + link.collectedPesewas, 0);
    const aggregates = derivePoolAggregates({
      capitalPesewas: poolSeed.capitalPesewas,
      totals: {
        disbursedPesewas,
        collectedPesewas,
        replenishmentPesewas: poolSeed.capitalPesewas,
        adjustmentPesewas: 0,
      },
    });

    await runInTransaction(async (tx) => {
      await poolRepo.insertPool(
        {
          id: poolSeed.id,
          name: poolSeed.name,
          region: poolSeed.region,
          source: poolSeed.source,
          capitalPesewas: poolSeed.capitalPesewas,
          disbursedPesewas: aggregates.disbursedPesewas,
          collectedPesewas: aggregates.collectedPesewas,
          outstandingPesewas: aggregates.outstandingPesewas,
          utilisationPercent: aggregates.utilisationPercent,
          status: aggregates.status,
          groupCount: poolSeed.groupCount,
          cycleLabel: poolSeed.cycleLabel,
          lastReplenishedAt: poolSeed.lastReplenishedAt,
          repaymentRatePercent: aggregates.repaymentRatePercent.toFixed(1),
        },
        tx,
      );

      await poolRepo.appendAllocation(
        {
          poolId: poolSeed.id,
          allocationType: 'REPLENISHMENT',
          amountPesewas: poolSeed.capitalPesewas,
          description: `${poolSeed.name} initial capital replenishment`,
        },
        tx,
      );

      for (const link of poolSeed.loanLinks) {
        await poolRepo.appendAllocation(
          {
            poolId: poolSeed.id,
            allocationType: 'DISBURSEMENT',
            amountPesewas: link.disbursedPesewas,
            loanId: link.loanId,
            description: `Disbursement allocation for loan ${link.loanId.slice(-4)}`,
          },
          tx,
        );

        if (link.collectedPesewas > 0) {
          await poolRepo.appendAllocation(
            {
              poolId: poolSeed.id,
              allocationType: 'REPAYMENT',
              amountPesewas: link.collectedPesewas,
              loanId: link.loanId,
              description: `Repayment attribution for loan ${link.loanId.slice(-4)}`,
            },
            tx,
          );
        }

        await tx
          .update(loans)
          .set({ loanPoolId: poolSeed.id })
          .where(eq(loans.id, link.loanId));
      }
    });
  }

  const poolCount = (await db.select({ id: loanPools.id }).from(loanPools)).length;
  console.log(`Loan pools seeded: ${poolCount} pool(s) present.`);
}

export async function verifySeededPoolIntegrity(): Promise<string[]> {
  const errors: string[] = [];
  const pools = await poolRepo.listPools();

  for (const pool of pools) {
    const totals = await poolRepo.sumAllocationTotals(pool.id);
    const integrityError = assertPoolBalanceIntegrity({
      stored: {
        capitalPesewas: pool.capitalPesewas,
        disbursedPesewas: pool.disbursedPesewas,
        collectedPesewas: pool.collectedPesewas,
        outstandingPesewas: pool.outstandingPesewas,
      },
      totals,
    });

    if (integrityError) {
      errors.push(`${pool.id}: ${integrityError}`);
    }
  }

  return errors;
}
