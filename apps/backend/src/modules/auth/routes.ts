import { Router } from 'express';
import type { z } from 'zod';
import { loginApiSchema } from '@wilms/shared-validation';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { encodeSessionToken } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate-body.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { userRepository } from '../../repositories/index.js';
import { DEMO_USERS } from '../../seed/demo-users.js';

export const authRouter = Router();

authRouter.post(
  '/auth/login',
  validateBody(loginApiSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginApiSchema>;
    const normalizedEmail = email.trim().toLowerCase();
    const user = isDatabaseEnabled()
      ? await userRepository.findUserByEmail(normalizedEmail)
      : DEMO_USERS.find((entry) => entry.email.toLowerCase() === normalizedEmail);

    if (!user || user.password !== password) {
      throw new AppError('Invalid email or password.', ERROR_CODE.UNAUTHORIZED, 401);
    }

    const expiresAt = Date.now() + env.sessionDurationMs;
    const session = {
      userId: user.id,
      role: user.role,
      displayName: user.displayName,
      expiresAt,
    };

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
