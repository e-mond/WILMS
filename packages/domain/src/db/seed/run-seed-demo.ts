import '../../config/load-env.js';
import { isDatabaseEnabled } from '../client.js';
import { seedFinancialCore } from './seed-financial.js';
import { seedLoanPools } from './seed-loan-pools.js';

async function main(): Promise<void> {
  if (!isDatabaseEnabled()) {
    console.error('DATABASE_URL is required to run seed.');
    process.exit(1);
  }

  await seedFinancialCore();
  await seedLoanPools();
  console.log('Demo financial seed completed (borrowers, loans, loan pools).');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
