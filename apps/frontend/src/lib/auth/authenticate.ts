import { USE_MOCK_SERVICES } from '@/config/api';
import type { LoginInput, SessionPayload } from '@/types/auth';
import { USER_ROLE, type UserRole } from '@/constants/roles';

interface RemoteLoginResponse {
  userId: string;
  role: UserRole;
  displayName?: string;
  expiresAt: number;
  token?: string;
  user?: {
    id: string;
    role: UserRole;
    displayName?: string;
  };
}

export interface CredentialAuthResult {
  session: SessionPayload;
  sessionToken: string;
}

export async function authenticateCredentials(
  credentials: LoginInput,
): Promise<CredentialAuthResult | null> {
  if (USE_MOCK_SERVICES) {
    const { authenticateMockCredentials } = await import('@/services/mock/authService.mock');
    const session = await authenticateMockCredentials(credentials);

    if (!session) {
      return null;
    }

    const { encodeSessionPayload } = await import('@/lib/auth/session');
    return {
      session,
      sessionToken: encodeSessionPayload(session),
    };
  }

  try {
    // BFF login runs on the server — call Railway directly. Routing through
    // /api/wilms proxy requires CSRF cookies that are not forwarded on server fetch.
    const upstream = process.env.WILMS_API_UPSTREAM?.trim().replace(/\/$/, '');
    if (!upstream) {
      return null;
    }

    const loginRes = await fetch(`${upstream}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      cache: 'no-store',
    });

    if (!loginRes.ok) {
      return null;
    }

    const envelope = (await loginRes.json()) as { data?: RemoteLoginResponse } | RemoteLoginResponse;
    const response =
      envelope && typeof envelope === 'object' && 'data' in envelope && envelope.data
        ? envelope.data
        : (envelope as RemoteLoginResponse);

    const session: SessionPayload = {
      userId: response.userId ?? response.user?.id ?? '',
      role: response.role ?? response.user?.role ?? USER_ROLE.COLLECTOR,
      displayName: response.displayName ?? response.user?.displayName,
      expiresAt: response.expiresAt,
    };

    if (!response.token) {
      return null;
    }

    return {
      session,
      sessionToken: response.token,
    };
  } catch {
    return null;
  }
}
