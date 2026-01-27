import api from '@/lib/api';
import { LoginResponse, RegisterResponse } from '@/types/api';
import { LoginDto } from '@/types/auth'; // Vou criar este arquivo a seguir
import { RegisterDto } from '@/types/auth'; // Vou criar este arquivo a seguir

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
    const response = await api.get('/auth/me');
    return response.data;
  }
};
