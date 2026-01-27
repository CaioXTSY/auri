import type { User } from '@/types/auth';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface RegisterResponse extends AuthTokens {
  user: User;
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
}
