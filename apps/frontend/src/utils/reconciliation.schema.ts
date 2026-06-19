import { z } from 'zod';

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

export function ghsInputToPesewas(value: string): number {
  return Math.round(Number(value) * 100);
}
