import type { GpsCoordinates } from '@/types/gps';

export type { GpsCoordinates };

export const PAYMENT_TRANSACTION_STATUS = {
  CONFIRMED: 'CONFIRMED',
  PENDING_SYNC: 'PENDING_SYNC',
} as const;

export type PaymentTransactionStatus =
  (typeof PAYMENT_TRANSACTION_STATUS)[keyof typeof PAYMENT_TRANSACTION_STATUS];

export interface RecordPaymentInput {
  borrowerId: string;
  amountPesewas: number;
  paymentDate: string;
  collectorId: string;
  loanId?: string;
  weeksCount?: number;
  /** Provided for offline queue replay; captured live when omitted. */
  gps?: GpsCoordinates;
}

export interface MarkMissedPaymentInput {
  borrowerId: string;
  paymentDate: string;
  collectorId: string;
  loanId?: string;
}

export interface MarkMissedPaymentResult {
  loanId: string;
  borrowerId: string;
  weekNumber: number;
  dueDate: string;
  status: 'MISSED';
  amountPesewas: number;
  remainingBalancePesewas: number;
  weeksRemaining: number;
}

export interface PaymentTransaction {
  id: string;
  borrowerId: string;
  amountPesewas: number;
  paymentDate: string;
  gps: GpsCoordinates;
  collectorId: string;
  recordedAt: string;
  status: PaymentTransactionStatus;
  editReason?: string;
  editedAt?: string;
  editedBy?: string;
}

export interface EditPaymentInput {
  collectorId: string;
  reason: string;
  gps?: GpsCoordinates;
}

export interface RecordPaymentQueuePayload {
  borrowerId: string;
  amountPesewas: number;
  paymentDate: string;
  gps: GpsCoordinates;
  collectorId: string;
  weeksCount?: number;
  loanId?: string;
}
