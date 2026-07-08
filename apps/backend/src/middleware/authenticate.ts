import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { AppError, ERROR_CODE } from '../http/errors.js';
import type { UserRole } from '../infrastructure/permissions/matrix.js';

export interface SessionUser {
  userId: string;
  role: UserRole;
  displayName?: string;
  expiresAt: number;
  status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

declare global {
  namespace Express {
    interface Request {
      session?: SessionUser;
    }
  }
}

const TOKEN_SEPARATOR = '.';

function encodePayloadBase64(session: SessionUser): string {
  const json = JSON.stringify(session);
  return Buffer.from(json, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function signPayload(payloadBase64: string): string {
  return createHmac('sha256', env.sessionSecret).update(payloadBase64).digest('base64url');
}

function parseSessionPayload(payloadBase64: string): SessionUser | null {
  try {
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
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
      status: parsed.status as SessionUser['status'] | undefined,
    };
  } catch {
    return null;
  }
}

function verifySignature(payloadBase64: string, signature: string): boolean {
  const expected = signPayload(payloadBase64);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (provided.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(provided, expectedBuffer);
}

function decodeSessionToken(token: string): SessionUser | null {
  const separatorIndex = token.indexOf(TOKEN_SEPARATOR);

  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return null;
  }

  const payloadBase64 = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  if (!verifySignature(payloadBase64, signature)) {
    return null;
  }

  return parseSessionPayload(payloadBase64);
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
  const payloadBase64 = encodePayloadBase64(session);
  return `${payloadBase64}.${signPayload(payloadBase64)}`;
}

/** Decode payload without signature verification — UI expiry hints only. */
export function decodeSessionPayloadUnsafe(token: string): SessionUser | null {
  const separatorIndex = token.indexOf(TOKEN_SEPARATOR);

  if (separatorIndex <= 0) {
    return null;
  }

  return parseSessionPayload(token.slice(0, separatorIndex));
}
