import type { CreateLoanFormValues, CreateLoanInput } from '@/types/loan';
export { calculateWeeklyPaymentPesewas } from '@/utils/loan-calculations';

export function parseGhsToPesewas(value: string): number | null {
  const normalized = value.trim().replace(/,/g, '');

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function toCreateLoanInput(values: CreateLoanFormValues): CreateLoanInput | null {
  const amountPesewas = parseGhsToPesewas(values.amountGhs);

  if (amountPesewas === null) {
    return null;
  }

  return {
    borrowerId: values.borrowerId,
    amountPesewas,
    durationWeeks: values.durationWeeks,
    paymentDay: values.paymentDay,
    cycleBatch: values.cycleBatch,
    startDate: values.startDate,
  };
}

export const DEFAULT_LOAN_FORM_VALUES: CreateLoanFormValues = {
  borrowerId: '',
  amountGhs: '',
  durationWeeks: 12,
  paymentDay: '',
  cycleBatch: '',
  startDate: '',
};
