import { USE_MOCK_SERVICES } from '@/config/api';
import type { LoginInput, SessionPayload } from '@/types/auth';
import { apiClient } from '@/utils/apiClient';
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
    const response = await apiClient.post<RemoteLoginResponse>('/auth/login', credentials);
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
