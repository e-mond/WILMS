import { z } from 'zod';

export const paymentEditSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Provide at least 10 characters explaining the correction'),
});

export type PaymentEditFormValues = z.infer<typeof paymentEditSchema>;
