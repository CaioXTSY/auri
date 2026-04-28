import { Bell, X } from 'lucide-react';
import type { NotificationItem } from '@/services/notifications-service';

interface NotificationsPopoverProps {
  open: boolean;
  unreadCount: number;
  notifications: NotificationItem[];
  isLoading: boolean;
  onToggle: () => void | Promise<void>;
  onClose: () => void;
  onMarkAllAsRead: () => void | Promise<void>;
  onMarkAsRead: (id: string) => void | Promise<void>;
}

export const NotificationsPopover = ({
  open,
  unreadCount,
  notifications,
  isLoading,
  onToggle,
  onClose,
  onMarkAllAsRead,
  onMarkAsRead,
}: NotificationsPopoverProps) => {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Abrir notificações"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onToggle}
        data-tour="notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Lista de notificações"
          className="absolute right-0 z-50 mt-3 w-80 rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">Notificações</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-xs font-semibold text-brand-700 hover:text-brand-900"
              >
                Marcar tudo
              </button>
              <button
                type="button"
                aria-label="Fechar notificações"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-slate-500">Carregando...</div>
            ) : null}
            {!isLoading && notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">
                Nenhuma notificação por aqui.
              </div>
            ) : null}
            {!isLoading
              ? notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => onMarkAsRead(notification.id)}
                    className={`w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${
                      notification.read ? 'bg-white' : 'bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </button>
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
