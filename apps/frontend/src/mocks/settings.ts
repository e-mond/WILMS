import { RECONCILIATION_VARIANCE_THRESHOLD_PERCENT } from '@/constants/reconciliation';
import type { SystemSettings } from '@/types/settings';

export const MOCK_SYSTEM_SETTINGS: SystemSettings = {
  adminFeePesewas: 5000,
  reconciliationVarianceThresholdPercent: RECONCILIATION_VARIANCE_THRESHOLD_PERCENT,
  smsNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  paymentReminderDaysBefore: 1,
  minGroupSize: 5,
  maxGroupSize: 10,
  updatedAt: '2026-06-01T08:00:00.000Z',
};
