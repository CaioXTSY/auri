import { useCallback, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/layouts/DashboardHeader';
import { DailyQuizModal } from '@/components/quiz/DailyQuizModal';
import { NotificationsPopover } from '@/components/layouts/NotificationsPopover';
import { SidebarNav } from '@/components/layouts/SidebarNav';
import { PlatformTour } from '@/components/onboarding/PlatformTour';
import { AppErrorBoundary } from '@/components/errors/AppErrorBoundary';
import { useToast } from '@/components/ui/use-toast';
import { useDashboardMenu } from '@/hooks/use-dashboard-menu';
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
  const { menuId, menuOpen, toggleMenu, closeMenu } = useDashboardMenu();

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

  const onNavClick = useCallback(() => closeMenu(), [closeMenu]);

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
        aria-controls={menuId}
        data-tour="mobile-menu"
        className="fixed left-0 top-1/2 z-50 flex -translate-y-1/2 items-center justify-center rounded-r-xl bg-brand-950 px-1.5 py-4 text-slate-100 shadow-lg md:hidden"
        onClick={toggleMenu}
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {menuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden"
          aria-hidden="true"
          onClick={closeMenu}
        />
      ) : null}

      <aside
        id={menuId}
        role="navigation"
        aria-label="Menu lateral móvel"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-brand-900 bg-brand-950 text-slate-100 transition-transform duration-300 ease-in-out md:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
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
        <DashboardHeader
          userRole={user?.role}
          userName={user?.name ?? firstName}
          firstName={firstName}
          email={user?.email}
          initials={initials}
          avatar={user?.avatar}
          userStats={user?.role === 'ALUNO' ? userStats : null}
          onLogout={handleLogout}
          notifications={
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
          }
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <AppErrorBoundary scope="dashboard">{children}</AppErrorBoundary>
        </main>
      </div>
    </div>
  );
};
