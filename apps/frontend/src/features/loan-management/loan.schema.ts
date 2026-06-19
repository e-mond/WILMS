import { z } from 'zod';
import {
  LOAN_CYCLE_BATCH_OPTIONS,
  PAYMENT_DAY_OPTIONS,
} from '@/constants/loan';
import { parseGhsToPesewas } from '@/features/loan-management/loan.utils';

export const borrowerSelectionSchema = z.object({
  borrowerId: z.string().trim().min(1, 'Select a borrower.'),
});

export const loanAmountSchema = z.object({
  amountGhs: z
    .string()
    .trim()
    .min(1, 'Loan amount is required.')
    .refine((value) => parseGhsToPesewas(value) !== null, {
      message: 'Enter a valid loan amount in GHS.',
    }),
  durationWeeks: z.coerce
    .number()
    .int('Duration must be a whole number of weeks.')
    .min(1, 'Duration must be at least 1 week.')
    .max(52, 'Duration cannot exceed 52 weeks.'),
});

export const loanScheduleSchema = z.object({
  paymentDay: z.enum(PAYMENT_DAY_OPTIONS, {
    required_error: 'Payment day is required.',
  }),
  cycleBatch: z.enum(LOAN_CYCLE_BATCH_OPTIONS, {
    required_error: 'Cycle or batch is required.',
  }),
  startDate: z
    .string()
    .min(1, 'Start date is required.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Enter a valid start date.',
    }),
});

export const createLoanSchema = borrowerSelectionSchema
  .merge(loanAmountSchema)
  .merge(loanScheduleSchema)
  .superRefine((data, context) => {
    const amountPesewas = parseGhsToPesewas(data.amountGhs);

    if (amountPesewas === null) {
      return;
    }

    if (amountPesewas % data.durationWeeks !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Loan amount must divide evenly across all weeks (no partial pesewas).',
        path: ['amountGhs'],
      });
    }
  });

export const LOAN_STEP_SCHEMAS = [
  borrowerSelectionSchema,
  loanAmountSchema,
  loanScheduleSchema,
] as const;

export const LOAN_STEP_FIELD_NAMES = [
  Object.keys(borrowerSelectionSchema.shape),
  Object.keys(loanAmountSchema.shape),
  Object.keys(loanScheduleSchema.shape),
] as const;
