import type { UserRole } from '@/constants/roles';

export interface SessionUser {
  id: string;
  role: UserRole;
  displayName?: string;
  status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
  displayName?: string;
  expiresAt: number;
  status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
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
  mustCompleteOnboarding?: boolean;
}

export interface LoginOtpChallenge {
  requiresOtp: true;
  challengeId: string;
  message: string;
}

export type LoginResponse = LoginResult | LoginOtpChallenge;

export function isLoginOtpChallenge(response: LoginResponse): response is LoginOtpChallenge {
  return 'requiresOtp' in response && response.requiresOtp === true;
}

export interface VerifyOtpInput {
  challengeId: string;
  code: string;
}

export interface CompleteOnboardingInput {
  newPassword: string;
  displayName?: string;
  phone?: string;
  branch?: string;
  region?: string;
  zone?: string;
}
