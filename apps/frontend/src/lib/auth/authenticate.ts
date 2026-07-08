import { USE_MOCK_SERVICES } from '@/config/api';
import type { LoginInput, SessionPayload } from '@/types/auth';
import { USER_ROLE, type UserRole } from '@/constants/roles';

interface RemoteLoginResponse {
  userId: string;
  role: UserRole;
  displayName?: string;
  expiresAt: number;
  status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  token?: string;
  mustCompleteOnboarding?: boolean;
  requiresOtp?: boolean;
  challengeId?: string;
  message?: string;
  user?: {
    id: string;
    role: UserRole;
    displayName?: string;
    status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  };
}

export type CredentialAuthResult =
  | {
      type: 'authenticated';
      session: SessionPayload;
      sessionToken: string;
      mustCompleteOnboarding?: boolean;
    }
  | {
      type: 'otp_required';
      challengeId: string;
      message: string;
    };

function mapRemoteLoginResponse(response: RemoteLoginResponse): CredentialAuthResult | null {
  if (response.requiresOtp && response.challengeId) {
    return {
      type: 'otp_required',
      challengeId: response.challengeId,
      message: response.message ?? 'Enter the verification code sent to your email and phone.',
    };
  }

  if (!response.token) {
    return null;
  }

  const session: SessionPayload = {
    userId: response.userId ?? response.user?.id ?? '',
    role: response.role ?? response.user?.role ?? USER_ROLE.COLLECTOR,
    displayName: response.displayName ?? response.user?.displayName,
    expiresAt: response.expiresAt,
    status: response.status ?? response.user?.status,
  };

  return {
    type: 'authenticated',
    session,
    sessionToken: response.token,
    mustCompleteOnboarding: response.mustCompleteOnboarding,
  };
}

async function postAuth<T>(path: string, body: object): Promise<T | null> {
  const upstream = process.env.WILMS_API_UPSTREAM?.trim().replace(/\/$/, '');
  if (!upstream) {
    return null;
  }

  const loginRes = await fetch(`${upstream}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!loginRes.ok) {
    return null;
  }

  const envelope = (await loginRes.json()) as { data?: T } | T;
  return envelope && typeof envelope === 'object' && 'data' in envelope && envelope.data
    ? envelope.data
    : (envelope as T);
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
      type: 'authenticated',
      session,
      sessionToken: encodeSessionPayload(session),
    };
  }

  try {
    const response = await postAuth<RemoteLoginResponse>('/auth/login', credentials);
    if (!response) {
      return null;
    }

    return mapRemoteLoginResponse(response);
  } catch {
    return null;
  }
}

export async function verifyOtpCredentials(input: {
  challengeId: string;
  code: string;
}): Promise<CredentialAuthResult | null> {
  if (USE_MOCK_SERVICES) {
    if (input.code !== '123456') {
      return null;
    }

    const session: SessionPayload = {
      userId: 'demo-user',
      role: USER_ROLE.SUPER_ADMIN,
      displayName: 'Demo Admin',
      expiresAt: Date.now() + 60 * 60 * 1000,
      status: 'ACTIVE',
    };
    const { encodeSessionPayload } = await import('@/lib/auth/session');
    return {
      type: 'authenticated',
      session,
      sessionToken: encodeSessionPayload(session),
    };
  }

  try {
    const response = await postAuth<RemoteLoginResponse>('/auth/verify-otp', input);
    if (!response) {
      return null;
    }

    return mapRemoteLoginResponse(response);
  } catch {
    return null;
  }
}

export async function completeOnboardingRequest(
  sessionToken: string,
  input: {
    newPassword: string;
    displayName?: string;
    phone?: string;
    branch?: string;
    region?: string;
    zone?: string;
  },
): Promise<CredentialAuthResult | null> {
  if (USE_MOCK_SERVICES) {
    const session: SessionPayload = {
      userId: 'demo-user',
      role: USER_ROLE.SUPER_ADMIN,
      displayName: input.displayName ?? 'Demo Admin',
      expiresAt: Date.now() + 60 * 60 * 1000,
      status: 'ACTIVE',
    };
    const { encodeSessionPayload } = await import('@/lib/auth/session');
    return {
      type: 'authenticated',
      session,
      sessionToken: encodeSessionPayload(session),
    };
  }

  const upstream = process.env.WILMS_API_UPSTREAM?.trim().replace(/\/$/, '');
  if (!upstream) {
    return null;
  }

  try {
    const response = await fetch(`${upstream}/auth/complete-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(input),
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const envelope = (await response.json()) as { data?: RemoteLoginResponse } | RemoteLoginResponse;
    const payload =
      envelope && typeof envelope === 'object' && 'data' in envelope && envelope.data
        ? envelope.data
        : (envelope as RemoteLoginResponse);

    return mapRemoteLoginResponse(payload);
  } catch {
    return null;
  }
}
