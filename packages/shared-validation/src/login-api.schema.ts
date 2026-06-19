import { z } from 'zod';

/** Backend login request validation (API contract). */
export const loginApiSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginApiInput = z.infer<typeof loginApiSchema>;

/** Ghana phone number used across registration and borrower forms. */
export const ghanaPhoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required.')
  .regex(/^(\+233|0)\d{9}$/, 'Enter a valid Ghana phone number (+233 or 0 prefix).');
