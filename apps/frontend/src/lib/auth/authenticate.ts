import { USE_MOCK_SERVICES } from '@/config/api';
import type { LoginInput, SessionPayload } from '@/types/auth';
import { apiClient } from '@/utils/apiClient';
import { USER_ROLE, type UserRole } from '@/constants/roles';

interface RemoteLoginResponse {
  userId: string;
  role: UserRole;
  displayName?: string;
  expiresAt: number;
  user?: {
    id: string;
    role: UserRole;
    displayName?: string;
  };
}

export async function authenticateCredentials(
  credentials: LoginInput,
): Promise<SessionPayload | null> {
  if (USE_MOCK_SERVICES) {
    const { authenticateMockCredentials } = await import('@/services/mock/authService.mock');
    return authenticateMockCredentials(credentials);
  }

  try {
    const response = await apiClient.post<RemoteLoginResponse>('/auth/login', credentials);

    return {
      userId: response.userId ?? response.user?.id ?? '',
      role: response.role ?? response.user?.role ?? USER_ROLE.COLLECTOR,
      displayName: response.displayName ?? response.user?.displayName,
      expiresAt: response.expiresAt,
    };
  } catch {
    return null;
  }
}
