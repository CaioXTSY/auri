import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DailyQuizModal } from '@/components/quiz/DailyQuizModal';
import { NotificationsPopover } from '@/components/layouts/NotificationsPopover';
import { SidebarNav } from '@/components/layouts/SidebarNav';
import { PlatformTour } from '@/components/onboarding/PlatformTour';
import {
  CLOSE_MOBILE_TOUR_MENU_EVENT,
  OPEN_MOBILE_TOUR_MENU_EVENT,
} from '@/components/onboarding/platform-tour-events';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '@/services/auth-service';
import { useDailyQuizState } from '@/hooks/use-daily-quiz-state';
import { useNotificationsCenter } from '@/hooks/use-notifications-center';
import { useAuthStore } from '@/stores/auth-store';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useToast();
  const {
    showDailyQuiz,
    userStats,
    handleDailyQuizClose,
    handleDailyQuizAnswered,
  } = useDailyQuizState({
    userId: user?.id,
    userRole: user?.role,
  });
  const {
    notificationsOpen,
    notifications,
    unreadCount,
    isNotificationsLoading,
    toggleNotifications,
    closeNotifications,
    markAllAsRead,
    markAsRead,
  } = useNotificationsCenter({
    userId: user?.id,
    token,
    onAchievementNotification: (payload) => {
      notify({
        title: payload.title,
        description: payload.message,
        variant: 'success',
      });
    },
  });

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const openMenu = () => setMenuOpen(true);
    const closeMenu = () => setMenuOpen(false);

    window.addEventListener(OPEN_MOBILE_TOUR_MENU_EVENT, openMenu);
    window.addEventListener(CLOSE_MOBILE_TOUR_MENU_EVENT, closeMenu);

    return () => {
      window.removeEventListener(OPEN_MOBILE_TOUR_MENU_EVENT, openMenu);
      window.removeEventListener(CLOSE_MOBILE_TOUR_MENU_EVENT, closeMenu);
    };
  }, []);

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

  const onNavClick = useCallback(() => setMenuOpen(false), []);

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

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <DailyQuizModal open={showDailyQuiz} onClose={handleDailyQuizClose} onAnswered={handleDailyQuizAnswered} />
      <PlatformTour userId={user?.id} role={user?.role} disabled={showDailyQuiz} />

      <button
        type="button"
        aria-label={menuOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
        aria-expanded={menuOpen}
        data-tour="mobile-menu"
        className="fixed left-0 top-1/2 z-50 flex -translate-y-1/2 items-center justify-center rounded-r-xl bg-brand-950 px-1.5 py-4 text-slate-100 shadow-lg md:hidden"
        onClick={() => setMenuOpen((current) => !current)}
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)} />
      ) : null}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-brand-900 bg-brand-950 text-slate-100 transition-transform duration-300 ease-in-out md:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarNav
          userRole={user?.role}
          firstName={firstName}
          initials={initials}
          isActive={isActive}
          onLogout={handleLogout}
          onNavClick={onNavClick}
          enableTourMarkers
        />
      </aside>

      <aside className="hidden w-64 flex-col border-r border-brand-900 bg-brand-950 text-slate-100 md:flex">
        <SidebarNav
          userRole={user?.role}
          firstName={firstName}
          initials={initials}
          isActive={isActive}
          onLogout={handleLogout}
          onNavClick={onNavClick}
          enableTourMarkers
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:h-20 md:px-8" data-tour="dashboard-greeting">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {user?.role === 'ADMIN' ? 'Painel Admin' : user?.role === 'PROFESSOR' ? 'Painel do Professor' : 'Painel do Aluno'}
              </span>
              <span className="font-display text-lg font-bold text-brand-900 md:text-xl">Olá, {firstName}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end text-xs text-slate-500 sm:flex" data-tour={user?.role === 'ALUNO' ? 'student-xp' : undefined}>
              <span className="font-semibold text-slate-700">{user?.email}</span>
              <span className="uppercase tracking-widest">
                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'PROFESSOR' ? 'Professor' : 'Aluno'}
              </span>
              {user?.role === 'ALUNO' && userStats ? (
                <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                  XP {userStats.currentXp} • Nível {userStats.level}
                  {userStats.currentStreak > 0 ? <span className="ml-1 font-semibold text-orange-500">🔥 {userStats.currentStreak}</span> : null}
                </span>
              ) : null}
            </div>

            <NotificationsPopover
              open={notificationsOpen}
              unreadCount={unreadCount}
              notifications={notifications}
              isLoading={isNotificationsLoading}
              onToggle={toggleNotifications}
              onClose={closeNotifications}
              onMarkAllAsRead={markAllAsRead}
              onMarkAsRead={markAsRead}
            />

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-sm font-bold uppercase text-accent-400">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
};
