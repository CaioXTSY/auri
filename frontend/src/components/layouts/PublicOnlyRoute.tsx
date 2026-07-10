import { useEffect, useState, type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { getAppEntryPath } from '@/lib/navigation';

interface PublicOnlyRouteProps {
  children: ReactElement;
}

export const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const setToken = useAuthStore((state) => state.setToken);
  const user = useAuthStore((state) => state.user);
  const [isCheckingSession, setIsCheckingSession] = useState(!isAuthenticated);

  useEffect(() => {
    let cancelled = false;

    if (isAuthenticated) {
      setIsCheckingSession(false);
      return () => {
        cancelled = true;
      };
    }

    const restoreSession = async () => {
      try {
        const tokens = await authService.refresh();
        setToken(tokens.access_token);
        const currentUser = await authService.me();
        if (!cancelled) {
          login(currentUser, tokens.access_token);
        }
      } catch {
        // Public routes must remain usable when there is no valid refresh cookie.
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, login, setToken]);

  if (isAuthenticated) {
    return <Navigate to={getAppEntryPath(user?.role)} replace />;
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="h-8 w-8 rounded-full border-4 border-accent-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return children;
};
