import { randomUUID } from 'node:crypto';

export interface PhotoCaptureSession {
  sessionToken: string;
  captureUrl: string;
  expiresAt: string;
  status: 'PENDING' | 'CAPTURED' | 'EXPIRED';
  capturedFileName?: string;
  capturedMimeType?: string;
  capturedDataUrl?: string;
}

export interface CreatePhotoCaptureSessionInput {
  registrationSessionId: string;
  officerId: string;
  target: 'borrower' | 'guarantor';
}

const sessions = new Map<string, PhotoCaptureSession>();

function buildSessionKey(input: CreatePhotoCaptureSessionInput): string {
  return `${input.registrationSessionId}:${input.target}`;
}

function createToken(): string {
  return `pcs_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export function createSession(input: CreatePhotoCaptureSessionInput): PhotoCaptureSession {
  const sessionToken = createToken();
  const session: PhotoCaptureSession = {
    sessionToken,
    captureUrl: `/capture/${sessionToken}`,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: 'PENDING',
  };

  sessions.set(buildSessionKey(input), session);
  sessions.set(sessionToken, session);
  return { ...session };
}

export function getSession(sessionToken: string): PhotoCaptureSession | null {
  const session = sessions.get(sessionToken);
  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt) < new Date() && session.status === 'PENDING') {
    const expired = { ...session, status: 'EXPIRED' as const };
    sessions.set(sessionToken, expired);
    return { ...expired };
  }

  return { ...session };
}
