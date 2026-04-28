import { useCallback, useEffect, useState } from 'react';
import { notificationsService, type NotificationItem } from '@/services/notifications-service';

interface UseNotificationsCenterProps {
  userId?: string;
  token?: string | null;
  onAchievementNotification?: (payload: NotificationItem) => void;
}

export const useNotificationsCenter = ({
  userId,
  token,
  onAchievementNotification,
}: UseNotificationsCenterProps) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);

  useEffect(() => {
    const loadUnread = async () => {
      if (!userId) return;
      try {
        const total = await notificationsService.getUnreadCount();
        setUnreadCount(total);
      } catch {
        setUnreadCount(0);
      }
    };

    loadUnread();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let disconnected = false;
    let socketRef: { disconnect: () => void } | null = null;

    import('socket.io-client').then(({ io }) => {
      if (disconnected) return;
      const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3001', {
        auth: { token },
      });
      socketRef = socket;
      socket.on('notification', (payload: NotificationItem) => {
        setNotifications((current) => [payload, ...current].slice(0, 5));
        setUnreadCount((current) => current + 1);

        if (payload.type === 'CONQUISTA') {
          onAchievementNotification?.(payload);
        }
      });
    });

    return () => {
      disconnected = true;
      socketRef?.disconnect();
    };
  }, [onAchievementNotification, token, userId]);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setIsNotificationsLoading(true);
    try {
      const response = await notificationsService.getNotifications(1, 5);
      setNotifications(response.data);
    } catch {
      setNotifications([]);
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [userId]);

  const toggleNotifications = useCallback(async () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState) {
      await loadNotifications();
    }
  }, [loadNotifications, notificationsOpen]);

  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationsService.markAllAsRead();
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const updated = await notificationsService.markAsRead(id);
    setNotifications((current) =>
      current.map((item) => (item.id === id ? updated : item)),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }, []);

  return {
    notificationsOpen,
    notifications,
    unreadCount,
    isNotificationsLoading,
    toggleNotifications,
    closeNotifications,
    markAllAsRead,
    markAsRead,
  };
};
