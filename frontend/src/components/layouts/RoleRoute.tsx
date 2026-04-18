import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types/auth';

interface RoleRouteProps {
  children: ReactElement;
  allow: Array<User['role']>;
  redirectTo?: string;
}

export const RoleRoute = ({ children, allow, redirectTo = '/dashboard' }: RoleRouteProps) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user || !allow.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};
