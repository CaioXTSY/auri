import { useEffect, useState } from 'react';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

export const useSessionValidation = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isValidating, setIsValidating] = useState(isAuthenticated);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      return () => {
        cancelled = true;
      };
    }

    authService
      .me()
      .then((user) => {
        if (!cancelled) {
          updateUser(user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          logout();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsValidating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, logout, token, updateUser]);

  return isAuthenticated && isValidating;
};
