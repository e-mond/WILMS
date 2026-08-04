import { createAuthRateLimiter } from './api-rate-limit.js';

export const loginRateLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  prefix: 'wilms:rl:login:',
  message: 'Too many login attempts. Please try again later.',
});
