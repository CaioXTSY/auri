import api from '@/lib/api';

export type NotificationType = 'SISTEMA' | 'ATIVIDADE' | 'CONQUISTA' | 'MISSAO' | 'RANKING';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  data: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationsService = {
  getNotifications: async (page = 1, limit = 5): Promise<NotificationResponse> => {
    const response = await api.get<NotificationResponse>('/notifications', {
      params: { page, limit },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<number>('/notifications/unread');
    return response.data;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const response = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>('/notifications/read-all');
    return response.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/notifications/${id}`);
    return response.data;
  },
};
