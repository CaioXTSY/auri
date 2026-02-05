import api from '@/lib/api';
import type { User } from '@/types/auth';

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
}

export const userService = {
  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  updateMe: async (payload: UpdateProfilePayload): Promise<User> => {
    const response = await api.patch<User>('/users/me', payload);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<User>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
