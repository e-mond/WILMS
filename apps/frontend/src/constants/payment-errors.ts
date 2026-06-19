import { API_ERROR_CODE } from '@/types/api';

export const PAYMENT_ERROR_ALERT_TITLE: Record<string, string> = {
  [API_ERROR_CODE.DUPLICATE_TRANSACTION]: 'Duplicate payment blocked',
  [API_ERROR_CODE.OVERPAYMENT]: 'Overpayment blocked',
};

export const PAYMENT_DUPLICATE_MESSAGE =
  'A payment with the same borrower, date, and amount already exists. Contact your supervisor if this is incorrect.';
