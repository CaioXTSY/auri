import { User } from '@/stores/auth-store';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
