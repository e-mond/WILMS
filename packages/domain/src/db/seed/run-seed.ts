import '../../config/load-env.js';
import { isDatabaseEnabled } from '../client.js';
import { seedReferenceData } from './run-seed-reference.js';
import { seedFinancialCore } from './seed-financial.js';
import { seedLoanPools } from './seed-loan-pools.js';

async function main(): Promise<void> {
  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL is required to run seed.');
    process.exit(1);
  }

  await seedReferenceData();

  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_SEED === 'true') {
    await seedFinancialCore();
    await seedLoanPools();
    console.log(
      'Database seed completed (RBAC + adjustment reasons + demo financial core + loan pools).',
    );
    return;
  }

  console.log('Database seed completed (RBAC + adjustment reasons). Demo financial seed skipped in production.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
