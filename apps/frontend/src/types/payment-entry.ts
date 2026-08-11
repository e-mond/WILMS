import type { ScheduleWeekStatus } from '@/types/loan-schedule';

export interface PaymentObligationWeek {
  weekNumber: number;
  dueDate: string;
  amountPesewas: number;
  status: ScheduleWeekStatus;
}

export type PaymentEscalationLevel = 'NONE' | 'DUE' | 'GRACE' | 'OVERDUE' | 'ESCALATED';

export interface PaymentEntryContext {
  borrowerId: string;
  borrowerName: string;
  phone: string;
  community: string;
  groupId?: string;
  groupName?: string;
  loanId: string;
  loanDisplayId?: string;
  outstandingPesewas?: number;
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
  missedWeeks?: PaymentObligationWeek[];
  payableWeeks?: PaymentObligationWeek[];
  totalPayableAmountPesewas?: number;
  totalOutstandingObligationsPesewas: number;
  nextDueDate?: string;
  gracePeriodEnd?: string;
  graceDays?: number;
  escalationLevel?: PaymentEscalationLevel;
  consecutiveMissedWeeks?: number;
  lastPayment?: {
    id: string;
    paymentDate: string;
    amountPesewas: number;
  };
  maxPayableWeeks?: number;
  canAcceptPayment: boolean;
  blockReason?: string;
  /** True when the oldest unpaid week is already marked MISSED. */
  recordedMissed?: boolean;
}
