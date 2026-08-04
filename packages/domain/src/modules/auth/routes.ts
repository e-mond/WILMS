import { Router } from 'express';
import type { z } from 'zod';
import { loginApiSchema } from '@wilms/shared-validation';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { verifyPassword } from '../../lib/password.js';
import { encodeSessionToken, requireAuth, type SessionUser } from '../../middleware/authenticate.js';
import { loginRateLimiter } from '../../middleware/login-rate-limit.js';
import { validateBody } from '../../middleware/validate-body.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { userRepository } from '../../repositories/index.js';
import { assertDemoLoginAllowed } from '../../lib/demo-accounts.js';
import {
  INVITATION_EXPIRED_MESSAGE,
  isInvitationExpired,
} from '../../lib/invitation-expiry.js';
import { DEMO_USERS } from '../../seed/demo-users.js';
import { getSettings } from '../settings/service.js';
import { completeOnboarding } from './onboarding.service.js';
import { createLoginOtpChallenge, verifyLoginOtpChallenge } from './otp.service.js';
import {
  requestPasswordReset,
  resetPasswordWithToken,
} from './password-reset.service.js';
import { assertSessionActive } from './session.service.js';
import { notifyInvitationAccepted, notifyLoginAlert } from '../../infrastructure/notifications/event-dispatch.js';

function summarizeUserAgent(userAgent?: string): string | undefined {
  if (!userAgent?.trim()) {
    return undefined;
  }

  if (/mobile|android|iphone/i.test(userAgent)) {
    return 'Mobile device';
  }

  if (/tablet|ipad/i.test(userAgent)) {
    return 'Tablet';
  }

  return 'Desktop browser';
}

async function sendLoginAlert(user: AuthUser, ip?: string, userAgent?: string): Promise<void> {
  try {
    await notifyLoginAlert({
      email: user.email,
      displayName: user.displayName,
      userId: user.id,
      deviceLabel: summarizeUserAgent(userAgent),
      locationLabel: ip ? `IP ${ip}` : undefined,
    });
  } catch (error) {
    console.error('[auth] login-alert notification failed:', error);
  }
}

async function recordSuccessfulLogin(user: AuthUser): Promise<void> {
  if (!isDatabaseEnabled()) {
    return;
  }

  if (user.status === 'INVITED') {
    await userRepository.recordFirstLogin(user.id);
    appendAuditEntry({
      action: 'user.invitation_accepted',
      actorId: user.id,
      actorDisplayName: user.displayName,
      targetEntityId: user.id,
      targetEntityType: 'user',
      reason: 'first-login',
    });
    return;
  }

  await userRepository.updateLastLoginAt(user.id);
}

export const authRouter = Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reset requests. Please try again later.' },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reset attempts. Please try again later.' },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Please try again later.' },
});

const completeOnboardingSchema = {
  newPassword: (value: unknown) => typeof value === 'string' && value.trim().length >= 10,
  displayName: (value: unknown) => value === undefined || (typeof value === 'string' && value.trim().length > 0),
  phone: (value: unknown) => value === undefined || typeof value === 'string',
  branch: (value: unknown) => value === undefined || typeof value === 'string',
  region: (value: unknown) => value === undefined || typeof value === 'string',
  zone: (value: unknown) => value === undefined || typeof value === 'string',
};

function mapAuthServiceError(error: unknown): never {
  if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
    throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 422);
  }
  throw error;
}

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

type AuthUser = {
  id: string;
  email: string;
  role: SessionUser['role'];
  displayName: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  phone?: string | null;
  sessionVersion: number;
  invitedAt?: Date | null;
};

async function resolveAuthUser(email: string): Promise<AuthUser | null> {
  if (isDatabaseEnabled()) {
    const row = await userRepository.findAnyUserByEmail(email);
    if (!row || row.deletedAt) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      displayName: row.displayName,
      status: row.status,
      phone: row.phone,
      sessionVersion: row.sessionVersion ?? 1,
      invitedAt: row.invitedAt ?? null,
    };
  }

  const demo = DEMO_USERS.find((entry) => entry.email.toLowerCase() === email);
  if (!demo) {
    return null;
  }

  return {
    id: demo.id,
    email: demo.email,
    role: demo.role,
    displayName: demo.displayName,
    status: demo.status ?? 'ACTIVE',
    phone: null,
    sessionVersion: 1,
    invitedAt: null,
  };
}

function assertInvitationStillValid(user: AuthUser): void {
  if (user.status !== 'INVITED') {
    return;
  }
  if (isInvitationExpired(user.invitedAt)) {
    throw new AppError(INVITATION_EXPIRED_MESSAGE, ERROR_CODE.VALIDATION, 422);
  }
}

async function resolveAuthPassword(email: string, password: string): Promise<boolean> {
  if (isDatabaseEnabled()) {
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
      return false;
    }
    return verifyPassword(password, user.password);
  }

  const demo = DEMO_USERS.find((entry) => entry.email.toLowerCase() === email);
  if (!demo) {
    return false;
  }
  return verifyPassword(password, demo.password);
}

function buildSessionPayload(user: AuthUser): SessionUser {
  return {
    userId: user.id,
    role: user.role,
    displayName: user.displayName,
    expiresAt: Date.now() + env.sessionDurationMs,
    status: user.status,
    sessionVersion: user.sessionVersion,
  };
}

function buildLoginResponse(user: AuthUser) {
  const session = buildSessionPayload(user);
  const mustCompleteOnboarding = user.status === 'INVITED';

  return {
    userId: user.id,
    role: user.role,
    displayName: user.displayName,
    expiresAt: session.expiresAt,
    status: user.status,
    user: {
      id: user.id,
      role: user.role,
      displayName: user.displayName,
      status: user.status,
    },
    token: encodeSessionToken(session),
    mustCompleteOnboarding,
  };
}

authRouter.post(
  '/auth/accept-invitation',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: { message: 'Too many invitation attempts. Please try again later.', code: 'RATE_LIMITED' },
    },
  }),
  asyncHandler(async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!token) {
      throw new AppError(
        'A valid invitation token is required. Open the Accept Invitation link from your email.',
        ERROR_CODE.VALIDATION,
        422,
      );
    }

    const { consumeInvitationToken, INVITATION_TOKEN_INVALID_MESSAGE } = await import(
      './invitation-token.service.js'
    );

    let consumed: { userId: string; email: string; displayName: string; role: string };
    try {
      consumed = await consumeInvitationToken({
        token,
        ipAddress: req.ip,
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
        const message = error.message.slice('VALIDATION:'.length);
        throw new AppError(message || INVITATION_TOKEN_INVALID_MESSAGE, ERROR_CODE.VALIDATION, 422);
      }
      throw error;
    }

    if (email && email !== consumed.email.toLowerCase()) {
      throw new AppError(INVITATION_TOKEN_INVALID_MESSAGE, ERROR_CODE.VALIDATION, 422);
    }

    if (!isDatabaseEnabled()) {
      sendData(res, { accepted: true, email: consumed.email });
      return;
    }

    const user = await userRepository.findAnyUserByEmail(consumed.email);
    if (!user || user.deletedAt || user.status !== 'INVITED') {
      throw new AppError(INVITATION_TOKEN_INVALID_MESSAGE, ERROR_CODE.VALIDATION, 422);
    }

    if (isInvitationExpired(user.invitedAt)) {
      throw new AppError(INVITATION_EXPIRED_MESSAGE, ERROR_CODE.VALIDATION, 422);
    }

    await userRepository.recordInvitationAccepted(user.id);

    appendAuditEntry({
      action: 'user.invitation_accepted',
      actorId: user.id,
      actorDisplayName: user.displayName,
      targetEntityId: user.id,
      targetEntityType: 'user',
      reason: 'accept-invitation-token',
    });

    try {
      await notifyInvitationAccepted({
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        userId: user.id,
      });
    } catch (error) {
      console.error('[auth] invitation-accepted notification failed:', error);
    }

    sendData(res, { accepted: true, email: user.email });
  }),
);

authRouter.post(
  '/auth/login',
  loginRateLimiter,
  validateBody(loginApiSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginApiSchema>;
    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = req.ip;

    try {
      assertDemoLoginAllowed(normalizedEmail);
    } catch (error) {
      if (error instanceof Error && error.message === 'DEMO_LOGIN_BLOCKED') {
        logLoginAttempt({ success: false, email: normalizedEmail, ip: clientIp });
        throw new AppError('Invalid email or password.', ERROR_CODE.UNAUTHORIZED, 401);
      }
      throw error;
    }

    const user = await resolveAuthUser(normalizedEmail);

    if (!user || user.status === 'SUSPENDED') {
      logLoginAttempt({ success: false, email: normalizedEmail, ip: clientIp });
      throw new AppError('Invalid email or password.', ERROR_CODE.UNAUTHORIZED, 401);
    }

    assertInvitationStillValid(user);

    const passwordValid = await resolveAuthPassword(normalizedEmail, password);

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

    const settings = await getSettings();

    if (settings.twoFactorRequired) {
      const challenge = await createLoginOtpChallenge({
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        role: user.role,
      });

      sendData(res, {
        requiresOtp: true,
        challengeId: challenge.challengeId,
        message: 'Enter the verification code sent to your email and phone.',
      });
      return;
    }

    await recordSuccessfulLogin(user);

    logLoginAttempt({
      success: true,
      email: normalizedEmail,
      userId: user.id,
      displayName: user.displayName,
      ip: clientIp,
    });

    void sendLoginAlert(user, clientIp, req.get('user-agent'));

    sendData(res, buildLoginResponse(user));
  }),
);

authRouter.post(
  '/auth/verify-otp',
  otpVerifyLimiter,
  asyncHandler(async (req, res) => {
    const challengeId = typeof req.body?.challengeId === 'string' ? req.body.challengeId : '';
    const code = typeof req.body?.code === 'string' ? req.body.code : '';

    if (!challengeId || !code.trim()) {
      throw new AppError('Verification code is required.', ERROR_CODE.VALIDATION, 422);
    }

    const session = await verifyLoginOtpChallenge({ challengeId, code });
    if (!session) {
      throw new AppError('Invalid or expired verification code.', ERROR_CODE.UNAUTHORIZED, 401);
    }

    const user = await resolveAuthUser(
      (await userRepository.getUserById(session.userId))?.email ??
        DEMO_USERS.find((entry) => entry.id === session.userId)?.email ??
        '',
    );

    if (!user) {
      throw new AppError('Invalid or expired verification code.', ERROR_CODE.UNAUTHORIZED, 401);
    }

    await recordSuccessfulLogin(user);

    logLoginAttempt({
      success: true,
      email: user.email,
      userId: user.id,
      displayName: user.displayName,
      ip: req.ip,
    });

    void sendLoginAlert(user, req.ip, req.get('user-agent'));

    sendData(res, buildLoginResponse(user));
  }),
);

authRouter.post(
  '/auth/complete-onboarding',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const displayName = typeof body.displayName === 'string' ? body.displayName : undefined;
    const phone = typeof body.phone === 'string' ? body.phone : undefined;
    const branch = typeof body.branch === 'string' ? body.branch : undefined;
    const region = typeof body.region === 'string' ? body.region : undefined;
    const zone = typeof body.zone === 'string' ? body.zone : undefined;

    if (!completeOnboardingSchema.newPassword(newPassword)) {
      throw new AppError('Password must be at least 8 characters.', ERROR_CODE.VALIDATION, 422);
    }

    if (!completeOnboardingSchema.displayName(displayName)) {
      throw new AppError('Display name is required.', ERROR_CODE.VALIDATION, 422);
    }

    try {
      await completeOnboarding(req.session!.userId, {
        newPassword,
        displayName,
        phone,
        branch,
        region,
        zone,
      });
    } catch (error) {
      mapAuthServiceError(error);
    }

    const user = await resolveAuthUser(
      (await userRepository.getUserById(req.session!.userId))?.email ?? '',
    );

    if (!user) {
      throw new AppError('User not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    sendData(res, buildLoginResponse({ ...user, status: 'ACTIVE' }));
  }),
);

authRouter.get(
  '/auth/session',
  asyncHandler(async (req, res) => {
    if (!req.session) {
      sendData(res, { authenticated: false, session: null });
      return;
    }

    try {
      await assertSessionActive(req.session);
    } catch {
      sendData(res, { authenticated: false, session: null });
      return;
    }

    sendData(res, { authenticated: true, session: req.session });
  }),
);

authRouter.post(
  '/auth/forgot-password',
  forgotPasswordLimiter,
  asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    try {
      sendData(
        res,
        await requestPasswordReset({
          email,
          ipAddress: req.ip,
        }),
      );
    } catch (error) {
      mapAuthServiceError(error);
    }
  }),
);

authRouter.post(
  '/auth/reset-password',
  resetPasswordLimiter,
  asyncHandler(async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    try {
      sendData(
        res,
        await resetPasswordWithToken({
          token,
          newPassword,
          ipAddress: req.ip,
        }),
      );
    } catch (error) {
      mapAuthServiceError(error);
    }
  }),
);
