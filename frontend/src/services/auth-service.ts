import api from '@/lib/api';
import type { LoginResponse, RegisterResponse } from '@/types/api';
import type { LoginDto, RegisterDto } from '@/types/auth';

export const authService = {
  login: async (data: LoginDto): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterDto): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  me: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};
