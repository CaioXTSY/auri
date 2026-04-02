import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Trophy, Settings, LogOut, Flag, Bell, X, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { DailyQuizModal } from '@/components/quiz/DailyQuizModal';
import { gamificationService, type UserStats } from '@/services/gamification-service';
import { notificationsService, type NotificationItem } from '@/services/notifications-service';

interface DashboardLayoutProps {
  children: ReactNode;
}

const MobileNavLink = ({ to, icon, label, active, onNav }: { to: string; icon: React.ReactNode; label: string; active: boolean; onNav: () => void }) => (
  <Link
    to={to}
    onClick={onNav}
    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-slate-100 last:border-0 ${active ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-slate-50'}`}
  >
    <span className={active ? 'text-brand-700' : 'text-slate-400'}>{icon}</span>
    {label}
  </Link>
);

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const [showDailyQuiz, setShowDailyQuiz] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const token = useAuthStore((state) => state.token);

  const dailyQuizKey = useMemo(() => {
    if (!user?.id) return null;
    const today = new Date();
    const dayKey = today.toISOString().slice(0, 10);
    return `auri-daily-quiz-${user.id}-${dayKey}`;
  }, [user?.id]);

  useEffect(() => {
    if (!dailyQuizKey) return;
    if (localStorage.getItem(dailyQuizKey)) return;
    const timeoutId = window.setTimeout(() => setShowDailyQuiz(true), 0);
    localStorage.setItem(dailyQuizKey, 'seen');
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dailyQuizKey]);

  useEffect(() => {
    const handleOpenDailyQuiz = () => {
      setShowDailyQuiz(true);
    };
    window.addEventListener('open-daily-quiz', handleOpenDailyQuiz);
    return () => {
      window.removeEventListener('open-daily-quiz', handleOpenDailyQuiz);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      if (!user?.id || user.role !== 'ALUNO') return;
      try {
        const stats = await gamificationService.getMyStats();
        if (!isMounted) return;
        setUserStats(stats);
      } catch {
        if (!isMounted) return;
        setUserStats(null);
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role]);

  useEffect(() => {
    const loadUnread = async () => {
      if (!user?.id) return;
      try {
        const total = await notificationsService.getUnreadCount();
        setUnreadCount(total);
      } catch {
        setUnreadCount(0);
      }
    };
    loadUnread();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3001', {
      auth: { userId: user.id, token },
    });
    socket.on('notification', (payload: NotificationItem) => {
      setNotifications((current) => [payload, ...current].slice(0, 5));
      setUnreadCount((current) => current + 1);
    });
    return () => {
      socket.disconnect();
    };
  }, [token, user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    setIsNotificationsLoading(true);
    try {
      const response = await notificationsService.getNotifications(1, 5);
      setNotifications(response.data);
    } catch {
      setNotifications([]);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const toggleNotifications = async () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState) {
      await loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    await notificationsService.markAllAsRead();
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
    setUnreadCount(0);
  };

  const markAsRead = async (id: string) => {
    const updated = await notificationsService.markAsRead(id);
    setNotifications((current) =>
      current.map((item) => (item.id === id ? updated : item)),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  };

  const handleDailyQuizClose = () => {
    if (dailyQuizKey) {
      localStorage.setItem(dailyQuizKey, 'dismissed');
    }
    setShowDailyQuiz(false);
  };

  const handleDailyQuizAnswered = async () => {
    if (dailyQuizKey) {
      localStorage.setItem(dailyQuizKey, 'answered');
    }
    // Atualiza o badge de streak no header imediatamente após responder
    if (user?.role === 'ALUNO') {
      try {
        const stats = await gamificationService.getMyStats();
        setUserStats(stats);
      } catch {
        // silencioso — o badge será atualizado no próximo carregamento
      }
    }
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Aluno';
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'AU';

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'bg-brand-900 text-accent-400'
      : 'text-slate-200 hover:bg-brand-900/80 hover:text-white transition-colors';
  };

  const navLinkProps = { onClick: () => setMobileMenuOpen(false) };

  const SidebarContent = () => (
    <>
      <div className="h-20 px-6 flex items-center border-b border-brand-900">
        <Link to="/" className="flex items-center gap-3" {...navLinkProps}>
          <div className="h-11 w-9 flex items-center justify-center bg-accent-600 text-brand-950 rounded-b-full shadow-sm">
            <span className="font-display font-bold text-xl">A</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-wide">AURI</span>
            <span className="font-serif text-[10px] italic text-slate-400 tracking-widest">PLATAFORMA</span>
          </div>
        </Link>
        <button
          type="button"
          className="ml-auto md:hidden p-1.5 rounded-md text-slate-400 hover:text-white"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 text-sm font-medium overflow-y-auto">
        {user?.role === 'PROFESSOR' ? (
          <>
            <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard')}`} {...navLinkProps}>
              <LayoutDashboard className="h-4 w-4" /><span>Visão Geral</span>
            </Link>
            <Link to="/dashboard/teacher/classes" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/teacher/classes')}`} {...navLinkProps}>
              <BookOpen className="h-4 w-4" /><span>Gerenciar Turmas</span>
            </Link>
            <Link to="/dashboard/posts" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/posts')}`} {...navLinkProps}>
              <MessageSquare className="h-4 w-4" /><span>Postagens</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard')}`} {...navLinkProps}>
              <LayoutDashboard className="h-4 w-4" /><span>Visão Geral</span>
            </Link>
            <Link to="/dashboard/classes" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/classes')}`} {...navLinkProps}>
              <BookOpen className="h-4 w-4" /><span>Minhas Turmas</span>
            </Link>
            <Link to="/dashboard/missions" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/missions')}`} {...navLinkProps}>
              <Flag className="h-4 w-4" /><span>Missões</span>
            </Link>
            <Link to="/dashboard/posts" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/posts')}`} {...navLinkProps}>
              <MessageSquare className="h-4 w-4" /><span>Postagens</span>
            </Link>
          </>
        )}
        <Link to="/dashboard/achievements" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/achievements')}`} {...navLinkProps}>
          <Trophy className="h-4 w-4" /><span>Gamificação</span>
        </Link>
        <Link to="/dashboard/settings" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/settings')}`} {...navLinkProps}>
          <Settings className="h-4 w-4" /><span>Configurações</span>
        </Link>
      </nav>

      <div className="px-4 py-4 border-t border-brand-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent-600 text-brand-950 flex items-center justify-center text-sm font-bold uppercase">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{firstName}</span>
            <span className="text-[11px] text-slate-400 uppercase tracking-wide">
              {user?.role === 'PROFESSOR' ? 'Professor' : 'Aluno'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="p-2 rounded-md text-slate-400 hover:text-accent-400 hover:bg-brand-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <DailyQuizModal
        open={showDailyQuiz}
        onClose={handleDailyQuizClose}
        onAnswered={handleDailyQuizAnswered}
      />

      {/* Mobile FAB overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile FAB */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden flex flex-col items-center gap-3">
        {/* Expanded nav panel */}
        <div className={`transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden min-w-[220px]">
            {user?.role === 'PROFESSOR' ? (
              <>
                <MobileNavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Visão Geral" active={isActive('/dashboard').includes('bg-brand')} onNav={() => setMobileMenuOpen(false)} />
                <MobileNavLink to="/dashboard/teacher/classes" icon={<BookOpen className="h-4 w-4" />} label="Gerenciar Turmas" active={isActive('/dashboard/teacher/classes').includes('bg-brand')} onNav={() => setMobileMenuOpen(false)} />
                <MobileNavLink to="/dashboard/posts" icon={<MessageSquare className="h-4 w-4" />} label="Postagens" active={isActive('/dashboard/posts').includes('bg-brand')} onNav={() => setMobileMenuOpen(false)} />
              </>
            ) : (
              <>
                <MobileNavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Visão Geral" active={isActive('/dashboard').includes('bg-brand')} onNav={() => setMobileMenuOpen(false)} />
                <MobileNavLink to="/dashboard/classes" icon={<BookOpen className="h-4 w-4" />} label="Minhas Turmas" active={isActive('/dashboard/classes').includes('bg-brand')} onNav={() => setMobileMenuOpen(false)} />
                <MobileNavLink to="/dashboard/missions" icon={<Flag className="h-4 w-4" />} label="Missões" active={isActive('/dashboard/missions').includes('bg-brand')} onNav={() => setMobileMenuOpen(false)} />
                <MobileNavLink to="/dashboard/posts" icon={<MessageSquare className="h-4 w-4" />} label="Postagens" active={isActive('/dashboard/posts').includes('bg-brand')} onNav={() => setMobileMenuOpen(false)} />
              </>
            )}
            <MobileNavLink to="/dashboard/achievements" icon={<Trophy className="h-4 w-4" />} label="Gamificação" active={isActive('/dashboard/achievements').includes('bg-brand')} onNav={() => setMobileMenuOpen(false)} />
            <MobileNavLink to="/dashboard/settings" icon={<Settings className="h-4 w-4" />} label="Configurações" active={isActive('/dashboard/settings').includes('bg-brand')} onNav={() => setMobileMenuOpen(false)} />
            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* FAB button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${mobileMenuOpen ? 'bg-slate-800 rotate-45' : 'bg-brand-950'}`}
        >
          {mobileMenuOpen
            ? <X className="h-6 w-6 text-white" />
            : <div className="h-8 w-7 flex items-center justify-center bg-accent-500 text-brand-950 rounded-b-full"><span className="font-display font-bold text-base leading-none">A</span></div>}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-brand-950 text-slate-100 border-r border-brand-900">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                {user?.role === 'PROFESSOR' ? 'Painel do Professor' : 'Painel do Aluno'}
              </span>
              <span className="text-lg md:text-xl font-display font-bold text-brand-900">
                Olá, {firstName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{user?.email}</span>
              <span className="uppercase tracking-widest">
                {user?.role === 'PROFESSOR' ? 'Professor' : 'Aluno'}
              </span>
              {user?.role === 'ALUNO' && userStats && (
                <span className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                  XP {userStats.currentXp} • Nível {userStats.level}
                  {userStats.currentStreak > 0 && (
                    <span className="ml-1 font-semibold text-orange-500">
                      🔥 {userStats.currentStreak}
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative h-10 w-10 rounded-full border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Notificações</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-brand-700 hover:text-brand-900"
                      >
                        Marcar tudo
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {isNotificationsLoading && (
                      <div className="px-4 py-6 text-sm text-slate-500">Carregando...</div>
                    )}
                    {!isNotificationsLoading && notifications.length === 0 && (
                      <div className="px-4 py-6 text-sm text-slate-500">
                        Nenhuma notificação por aqui.
                      </div>
                    )}
                    {!isNotificationsLoading &&
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
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
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="h-10 w-10 rounded-full bg-brand-900 text-accent-400 flex items-center justify-center text-sm font-bold uppercase">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 pb-28 md:pb-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

