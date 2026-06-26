import { Router } from 'express';
import type { z } from 'zod';
import { loginApiSchema } from '@wilms/shared-validation';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { verifyPassword } from '../../lib/password.js';
import { encodeSessionToken } from '../../middleware/authenticate.js';
import { loginRateLimiter } from '../../middleware/login-rate-limit.js';
import { validateBody } from '../../middleware/validate-body.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { userRepository } from '../../repositories/index.js';
import { DEMO_USERS } from '../../seed/demo-users.js';

export const authRouter = Router();

function logLoginAttempt(params: {
  success: boolean;
  email: string;
  userId?: string;
  displayName?: string;
  ip?: string;
}): void {
  if (!params.userId) {
    return;
  }

  appendAuditEntry({
    action: params.success ? 'user.logged-in' : 'user.login-failed',
    actorId: params.userId ?? 'anonymous',
    actorDisplayName: params.displayName,
    targetEntityId: params.userId ?? params.email,
    targetEntityType: 'user',
    reason: params.success
      ? `login-success${params.ip ? ` ip=${params.ip}` : ''}`
      : `login-failed email=${params.email}${params.ip ? ` ip=${params.ip}` : ''}`,
  });
}

authRouter.post(
  '/auth/login',
  loginRateLimiter,
  validateBody(loginApiSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginApiSchema>;
    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = req.ip;
    const user = isDatabaseEnabled()
      ? await userRepository.findUserByEmail(normalizedEmail)
      : DEMO_USERS.find((entry) => entry.email.toLowerCase() === normalizedEmail);

    if (!user || user.status === 'SUSPENDED') {
      logLoginAttempt({ success: false, email: normalizedEmail, ip: clientIp });
      throw new AppError('Invalid email or password.', ERROR_CODE.UNAUTHORIZED, 401);
    }

    const passwordValid = await verifyPassword(password, user.password);

    if (!passwordValid) {
      logLoginAttempt({
        success: false,
        email: normalizedEmail,
        userId: user.id,
        displayName: user.displayName,
        ip: clientIp,
      });
      throw new AppError('Invalid email or password.', ERROR_CODE.UNAUTHORIZED, 401);
    }

    if (isDatabaseEnabled()) {
      await userRepository.updateLastLoginAt(user.id);
    }

    const expiresAt = Date.now() + env.sessionDurationMs;
    const session = {
      userId: user.id,
      role: user.role,
      displayName: user.displayName,
      expiresAt,
    };

    logLoginAttempt({
      success: true,
      email: normalizedEmail,
      userId: user.id,
      displayName: user.displayName,
      ip: clientIp,
    });

    sendData(res, {
      userId: user.id,
      role: user.role,
      displayName: user.displayName,
      expiresAt,
      user: {
        id: user.id,
        role: user.role,
        displayName: user.displayName,
      },
      token: encodeSessionToken(session),
    });
  }),
);

authRouter.get(
  '/auth/session',
  asyncHandler(async (req, res) => {
    sendData(res, { authenticated: Boolean(req.session), session: req.session ?? null });
  }),
);
