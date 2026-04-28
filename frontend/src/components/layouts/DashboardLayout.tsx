import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Trophy, Settings, LogOut, Flag, Bell, X, MessageSquare, Menu, Users, GraduationCap, Target, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { AchievementUnlockOverlay } from '@/components/gamification/AchievementUnlockOverlay';
import { DailyQuizModal } from '@/components/quiz/DailyQuizModal';
import { PlatformTour } from '@/components/onboarding/PlatformTour';
import { authService } from '@/services/auth-service';
import { gamificationService, type UserStats } from '@/services/gamification-service';
import { notificationsService, type NotificationItem } from '@/services/notifications-service';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface SidebarContentProps {
  userRole: string | undefined;
  firstName: string;
  initials: string;
  isActive: (path: string) => string;
  logout: () => void | Promise<void>;
  onNavClick: () => void;
  enableTourMarkers?: boolean;
}

const tourAttr = (enabled: boolean | undefined, value: string) =>
  enabled ? { 'data-tour': value } : {};

const SidebarContent = memo(({ userRole, firstName, initials, isActive, logout, onNavClick, enableTourMarkers }: SidebarContentProps) => {
  const marker = (value: string) => tourAttr(enableTourMarkers, value);

  return (
  <>
    <div className="h-20 px-6 flex items-center justify-center relative border-b border-brand-900">
      <Link to="/" onClick={onNavClick}>
        <img src="/auri_logo.webp" alt="AURI" className="h-14 w-auto" />
      </Link>
      <button
        type="button"
        className="absolute right-4 md:hidden p-1.5 rounded-md text-slate-400 hover:text-white"
        onClick={onNavClick}
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    <nav className="flex-1 px-3 py-6 space-y-1 text-sm font-medium overflow-y-auto">
      {userRole === 'ADMIN' ? (
        <>
          <Link to="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/admin')}`} onClick={onNavClick} {...marker('admin-overview')}>
            <LayoutDashboard className="h-4 w-4" /><span>Visão Geral</span>
          </Link>
          <Link to="/admin/users" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/admin/users')}`} onClick={onNavClick} {...marker('admin-users')}>
            <Users className="h-4 w-4" /><span>Usuários</span>
          </Link>
          <Link to="/admin/classes" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/admin/classes')}`} onClick={onNavClick} {...marker('admin-classes')}>
            <GraduationCap className="h-4 w-4" /><span>Turmas</span>
          </Link>
          <Link to="/admin/missions" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/admin/missions')}`} onClick={onNavClick} {...marker('admin-missions')}>
            <Target className="h-4 w-4" /><span>Missões</span>
          </Link>
          <Link to="/admin/achievements" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/admin/achievements')}`} onClick={onNavClick} {...marker('admin-achievements')}>
            <Trophy className="h-4 w-4" /><span>Conquistas</span>
          </Link>
          <Link to="/admin/ai-generations" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/admin/ai-generations')}`} onClick={onNavClick} {...marker('admin-ai-generations')}>
            <Sparkles className="h-4 w-4" /><span>Gerações IA</span>
          </Link>
          <Link to="/admin/notifications" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/admin/notifications')}`} onClick={onNavClick} {...marker('admin-broadcast')}>
            <Bell className="h-4 w-4" /><span>Broadcast</span>
          </Link>
        </>
      ) : userRole === 'PROFESSOR' ? (
        <>
          <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard')}`} onClick={onNavClick} {...marker('professor-overview')}>
            <LayoutDashboard className="h-4 w-4" /><span>Visão Geral</span>
          </Link>
          <Link to="/dashboard/teacher/classes" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/teacher/classes')}`} onClick={onNavClick} {...marker('professor-classes')}>
            <BookOpen className="h-4 w-4" /><span>Gerenciar Turmas</span>
          </Link>
          <Link to="/dashboard/posts" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/posts')}`} onClick={onNavClick} {...marker('professor-posts')}>
            <MessageSquare className="h-4 w-4" /><span>Postagens</span>
          </Link>
        </>
      ) : (
        <>
          <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard')}`} onClick={onNavClick} {...marker('student-overview')}>
            <LayoutDashboard className="h-4 w-4" /><span>Visão Geral</span>
          </Link>
          <Link to="/dashboard/classes" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/classes')}`} onClick={onNavClick} {...marker('student-classes')}>
            <BookOpen className="h-4 w-4" /><span>Minhas Turmas</span>
          </Link>
          <Link to="/dashboard/missions" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/missions')}`} onClick={onNavClick} {...marker('student-missions')}>
            <Flag className="h-4 w-4" /><span>Missões</span>
          </Link>
          <Link to="/dashboard/posts" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/posts')}`} onClick={onNavClick} {...marker('student-posts')}>
            <MessageSquare className="h-4 w-4" /><span>Postagens</span>
          </Link>
          <Link to="/dashboard/achievements" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/achievements')}`} onClick={onNavClick} {...marker('student-achievements')}>
            <Trophy className="h-4 w-4" /><span>Gamificação</span>
          </Link>
        </>
      )}
      <Link to="/dashboard/settings" className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/settings')}`} onClick={onNavClick} {...marker('settings')}>
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
            {userRole === 'ADMIN' ? 'Admin' : userRole === 'PROFESSOR' ? 'Professor' : 'Aluno'}
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
});

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();
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
    if (user?.role !== 'ALUNO') return;
    if (!dailyQuizKey) return;
    if (localStorage.getItem(dailyQuizKey)) return;
    const timeoutId = window.setTimeout(() => setShowDailyQuiz(true), 0);
    localStorage.setItem(dailyQuizKey, 'seen');
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dailyQuizKey, user?.role]);

  useEffect(() => {
    if (user?.role !== 'ALUNO') return;
    const handleOpenDailyQuiz = () => {
      setShowDailyQuiz(true);
    };
    window.addEventListener('open-daily-quiz', handleOpenDailyQuiz);
    return () => {
      window.removeEventListener('open-daily-quiz', handleOpenDailyQuiz);
    };
  }, [user?.role]);

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
      });
    });

    return () => {
      disconnected = true;
      socketRef?.disconnect();
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
    if (user?.role === 'ALUNO') {
      try {
        const stats = await gamificationService.getMyStats();
        setUserStats(stats);
      } catch {
        setUserStats(null);
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

  const isActive = useCallback((path: string) => {
    return location.pathname === path
      ? 'bg-brand-900 text-accent-400'
      : 'text-slate-200 hover:bg-brand-900/80 hover:text-white transition-colors';
  }, [location.pathname]);

  const onNavClick = useCallback(() => setMobileMenuOpen(false), []);
  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Local cleanup must happen even if the remote session is already invalid.
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  const sidebarProps = {
    userRole: user?.role,
    firstName,
    initials,
    isActive,
    logout: handleLogout,
    onNavClick,
  };

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <DailyQuizModal
        open={showDailyQuiz}
        onClose={handleDailyQuizClose}
        onAnswered={handleDailyQuizAnswered}
      />
      <PlatformTour
        userId={user?.id}
        role={user?.role}
        disabled={showDailyQuiz || mobileMenuOpen}
      />
      <AchievementUnlockOverlay
        key={user?.id ?? 'guest'}
        userId={user?.id}
        enabled={user?.role === 'ALUNO' && !showDailyQuiz}
      />

      {/* Mobile hamburger — fixed left center */}
      <button
        type="button"
        data-tour="mobile-menu"
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 md:hidden bg-brand-950 text-slate-100 rounded-r-xl px-1.5 py-4 shadow-lg flex items-center justify-center"
        onClick={() => setMobileMenuOpen((o) => !o)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-brand-950 text-slate-100 border-r border-brand-900 transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-brand-950 text-slate-100 border-r border-brand-900">
        <SidebarContent {...sidebarProps} enableTourMarkers />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between bg-white border-b border-slate-200" data-tour="dashboard-greeting">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                {user?.role === 'ADMIN' ? 'Painel Admin' : user?.role === 'PROFESSOR' ? 'Painel do Professor' : 'Painel do Aluno'}
              </span>
              <span className="text-lg md:text-xl font-display font-bold text-brand-900">
                Olá, {firstName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-xs text-slate-500" data-tour={user?.role === 'ALUNO' ? 'student-xp' : undefined}>
              <span className="font-semibold text-slate-700">{user?.email}</span>
              <span className="uppercase tracking-widest">
                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'PROFESSOR' ? 'Professor' : 'Aluno'}
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
                data-tour="notifications"
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

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

