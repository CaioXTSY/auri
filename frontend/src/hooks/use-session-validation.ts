import { useEffect, useState } from 'react';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

let sessionValidationPromise: Promise<void> | null = null;
let hasValidatedSession = false;

export const useSessionValidation = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isValidating, setIsValidating] = useState(
    isAuthenticated && !hasValidatedSession,
  );

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      hasValidatedSession = false;
      sessionValidationPromise = null;
      setIsValidating(false);
      return () => {
        cancelled = true;
      };
    }

    if (hasValidatedSession) {
      setIsValidating(false);
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

      const user = await authService.me();
      updateUser(user);
      hasValidatedSession = true;
    };

    setIsValidating(true);
    sessionValidationPromise ??= validateSession().finally(() => {
      sessionValidationPromise = null;
    });

    sessionValidationPromise
      .catch(() => {
        hasValidatedSession = false;
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
