import { z } from 'zod';
import { RECONCILIATION_FLAGGED_COMMENT_MIN_LENGTH } from '@/constants/reconciliation';

export const reconciliationFormSchema = z.object({
  physicalCashGhs: z
    .string()
    .trim()
    .min(1, 'Enter the physical cash counted')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: 'Enter a valid amount in GHS',
    }),
});

export type ReconciliationFormValues = z.infer<typeof reconciliationFormSchema>;

export function flaggedCommentSchema(flagged: boolean) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!flagged) {
        return;
      }

      if (value.length < RECONCILIATION_FLAGGED_COMMENT_MIN_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `A comment of at least ${RECONCILIATION_FLAGGED_COMMENT_MIN_LENGTH} characters is required when variance is flagged.`,
        });
      }
    });
}

export function ghsInputToPesewas(value: string): number {
  return Math.round(Number(value) * 100);
}
