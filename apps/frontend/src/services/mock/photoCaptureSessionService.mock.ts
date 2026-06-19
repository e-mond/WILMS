import type {
  CreatePhotoCaptureSessionInput,
  PhotoCaptureSession,
} from '@/types/photo-capture-session';
import type { IPhotoCaptureSessionService } from '@/types/services';
import { simulateDelay } from '@/services/mock/delay';

const sessions = new Map<string, PhotoCaptureSession>();

function buildSessionKey(input: CreatePhotoCaptureSessionInput): string {
  return `${input.registrationSessionId}:${input.target}`;
}

function createToken(): string {
  return `pcs_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

const photoCaptureSessionServiceMock: IPhotoCaptureSessionService = {
  async createSession(input: CreatePhotoCaptureSessionInput): Promise<PhotoCaptureSession> {
    await simulateDelay(120);
    const sessionToken = createToken();
    const captureUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://wilms.app'}/capture/${sessionToken}`;
    const session: PhotoCaptureSession = {
      sessionToken,
      captureUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: 'PENDING',
    };

    sessions.set(buildSessionKey(input), session);
    sessions.set(sessionToken, session);
    return { ...session };
  },

  async getSession(sessionToken: string): Promise<PhotoCaptureSession | null> {
    await simulateDelay(80);
    const session = sessions.get(sessionToken);
    return session ? { ...session } : null;
  },

  async simulatePhoneCapture(sessionToken: string, dataUrl: string): Promise<PhotoCaptureSession> {
    await simulateDelay(200);
    const session = sessions.get(sessionToken);

    if (!session) {
      throw new Error('Capture session not found.');
    }

    const updated: PhotoCaptureSession = {
      ...session,
      status: 'CAPTURED',
      capturedDataUrl: dataUrl,
      capturedFileName: `${sessionToken}.jpg`,
      capturedMimeType: 'image/jpeg',
    };

    sessions.set(sessionToken, updated);
    return { ...updated };
  },
};

export default photoCaptureSessionServiceMock;
