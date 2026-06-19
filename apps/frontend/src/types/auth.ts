import type { UserRole } from '@/constants/roles';

export interface SessionUser {
  id: string;
  role: UserRole;
  displayName?: string;
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
  displayName?: string;
  expiresAt: number;
}

export interface AuthSession {
  user: SessionUser;
  expiresAt: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  user: SessionUser;
  expiresAt: number;
}
