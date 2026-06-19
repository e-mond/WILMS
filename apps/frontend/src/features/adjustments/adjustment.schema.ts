import { z } from 'zod';

export const adjustmentReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Provide at least 10 characters explaining the rejection.'),
});

export const createAdjustmentSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Provide at least 10 characters explaining the adjustment.'),
});
