import { FLAG_ENTITY_TYPE, type FlagEntityType } from '@/types/risk-flag';

export const FLAG_ENTITY_TYPE_DISPLAY: Record<FlagEntityType, string> = {
  [FLAG_ENTITY_TYPE.BORROWER]: 'Borrower',
  [FLAG_ENTITY_TYPE.GROUP]: 'Group',
  [FLAG_ENTITY_TYPE.COLLECTOR]: 'Collector',
  [FLAG_ENTITY_TYPE.LOAN_POOL]: 'Loan Pool',
  [FLAG_ENTITY_TYPE.APPLICATION]: 'Application',
};
