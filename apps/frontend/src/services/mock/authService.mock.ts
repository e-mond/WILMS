import { SESSION_DURATION_MS } from '@/constants/session';
import { MOCK_USERS } from '@/mocks/users';
import type { LoginInput, SessionPayload } from '@/types/auth';

export function authenticateMockCredentials(credentials: LoginInput): SessionPayload | null {
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const user = MOCK_USERS.find(
    (entry) =>
      entry.email.toLowerCase() === normalizedEmail && entry.password === credentials.password,
  );

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    role: user.role,
    displayName: user.displayName,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
}
