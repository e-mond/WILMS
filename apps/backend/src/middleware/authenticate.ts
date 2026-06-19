import type { NextFunction, Request, Response } from 'express';
import { AppError, ERROR_CODE } from '../http/errors.js';
import type { UserRole } from '../infrastructure/permissions/matrix.js';

export interface SessionUser {
  userId: string;
  role: UserRole;
  displayName?: string;
  expiresAt: number;
}

declare global {
  namespace Express {
    interface Request {
      session?: SessionUser;
    }
  }
}

function decodeSessionToken(token: string): SessionUser | null {
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(`${base64}${padding}`, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as Partial<SessionUser>;

    if (
      typeof parsed.userId !== 'string' ||
      typeof parsed.role !== 'string' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      return null;
    }

    return {
      userId: parsed.userId,
      role: parsed.role as UserRole,
      displayName: parsed.displayName,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

function extractSession(req: Request): SessionUser | null {
  const authHeader = req.header('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return decodeSessionToken(authHeader.slice('Bearer '.length).trim());
  }

  const cookie = req.cookies?.wilms_session;

  if (typeof cookie === 'string') {
    return decodeSessionToken(cookie);
  }

  return null;
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  req.session = extractSession(req) ?? undefined;
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const session = extractSession(req);

  if (!session) {
    next(new AppError('Authentication required.', ERROR_CODE.UNAUTHORIZED, 401));
    return;
  }

  req.session = session;
  next();
}

export function encodeSessionToken(session: SessionUser): string {
  const json = JSON.stringify(session);
  return Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
