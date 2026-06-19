import { z } from 'zod';

export const approvalReasonSchema = z.object({
  reason: z.string().trim().min(1, 'A reason is required.'),
});

export type ApprovalReasonInput = z.infer<typeof approvalReasonSchema>;
