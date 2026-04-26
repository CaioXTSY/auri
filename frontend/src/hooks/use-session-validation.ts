import { useEffect, useState } from 'react';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

export const useSessionValidation = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
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

    const validateSession = async () => {
      const currentToken = useAuthStore.getState().token;
      if (!currentToken) {
        const tokens = await authService.refresh();
        useAuthStore.getState().setToken(tokens.access_token);
      }

      return authService.me();
    };

    validateSession()
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
  }, [isAuthenticated, logout, updateUser]);

  return isAuthenticated && isValidating;
};
