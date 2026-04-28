import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { getAppEntryPath } from '@/lib/navigation';

interface PublicOnlyRouteProps {
  children: ReactElement;
}

export const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated) {
    return <Navigate to={getAppEntryPath(user?.role)} replace />;
  }

  return children;
};
