import { useCallback, useEffect, useId, useState } from 'react';
import {
  CLOSE_MOBILE_TOUR_MENU_EVENT,
  OPEN_MOBILE_TOUR_MENU_EVENT,
} from '@/components/onboarding/platform-tour-events';

export const useDashboardMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

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

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((current) => !current);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return {
    menuId,
    menuOpen,
    toggleMenu,
    closeMenu,
  };
};
