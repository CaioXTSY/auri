export const OPEN_TOUR_EVENT = 'auri-open-platform-tour';
export const OPEN_MOBILE_TOUR_MENU_EVENT = 'auri-open-mobile-tour-menu';
export const CLOSE_MOBILE_TOUR_MENU_EVENT = 'auri-close-mobile-tour-menu';
export const PLATFORM_TOUR_STATE_CHANGED_EVENT = 'auri-platform-tour-state-changed';
export const PLATFORM_TOUR_VERSION = 'v2';

export type PlatformTourRole = 'ADMIN' | 'PROFESSOR' | 'ALUNO';

export const getPlatformTourKey = (userId: string, role: PlatformTourRole) =>
  `auri-platform-tour:${userId}:${role}:${PLATFORM_TOUR_VERSION}`;

export const openPlatformTour = () => {
  window.dispatchEvent(new Event(OPEN_TOUR_EVENT));
};

export const openMobileTourMenu = () => {
  window.dispatchEvent(new Event(OPEN_MOBILE_TOUR_MENU_EVENT));
};

export const closeMobileTourMenu = () => {
  window.dispatchEvent(new Event(CLOSE_MOBILE_TOUR_MENU_EVENT));
};
