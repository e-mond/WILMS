import { DEMO_ACCOUNTS } from '@/constants/demo-accounts';

export function getCollectorDisplayName(collectorId: string): string {
  return DEMO_ACCOUNTS.find((account) => account.id === collectorId)?.displayName ?? 'Collector';
}
