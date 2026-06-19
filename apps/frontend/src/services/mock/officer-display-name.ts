import { DEMO_ACCOUNTS } from '@/constants/demo-accounts';

export function getOfficerDisplayName(officerId: string): string {
  return DEMO_ACCOUNTS.find((account) => account.id === officerId)?.displayName ?? 'Unknown Officer';
}
