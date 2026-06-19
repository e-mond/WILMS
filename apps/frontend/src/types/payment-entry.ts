import type { ScheduleWeekStatus } from '@/types/loan-schedule';

export interface PaymentObligationWeek {
  weekNumber: number;
  dueDate: string;
  amountPesewas: number;
  status: ScheduleWeekStatus;
}

export interface PaymentEntryContext {
  borrowerId: string;
  borrowerName: string;
  phone: string;
  community: string;
  loanId: string;
  paymentDay: string;
  weeklyPaymentPesewas: number;
  referenceDate: string;
  isPaymentDay: boolean;
  /** Exact amount for a single valid payment (one weekly installment). */
  requiredAmountPesewas: number;
  /** Oldest unpaid obligation this payment will clear. */
  oldestObligation?: PaymentObligationWeek;
  /** All outstanding obligations (arrears + current due week). */
  obligationWeeks: PaymentObligationWeek[];
  totalOutstandingObligationsPesewas: number;
  canAcceptPayment: boolean;
  blockReason?: string;
}
