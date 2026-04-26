import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSessionValidation } from '@/hooks/use-session-validation';
import { useAuthStore } from '@/stores/auth-store';

interface ProtectedRouteProps {
  children: ReactElement;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isValidating = useSessionValidation();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="h-8 w-8 rounded-full border-4 border-accent-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return children;
};

