import { z } from 'zod';
import { APP_LOCK_PIN_LENGTH } from '@/constants/app-lock';

const pinPattern = new RegExp(`^\\d{${APP_LOCK_PIN_LENGTH}}$`);

export const appLockPinSchema = z
  .string()
  .regex(pinPattern, `PIN must be exactly ${APP_LOCK_PIN_LENGTH} digits.`);

export const setAppLockPinSchema = z
  .object({
    pin: appLockPinSchema,
    confirmPin: appLockPinSchema,
  })
  .refine((values) => values.pin === values.confirmPin, {
    message: 'PIN entries do not match.',
    path: ['confirmPin'],
  });

export type SetAppLockPinInput = z.infer<typeof setAppLockPinSchema>;
