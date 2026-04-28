export const OPEN_TOUR_EVENT = 'auri-open-platform-tour';
export const OPEN_MOBILE_TOUR_MENU_EVENT = 'auri-open-mobile-tour-menu';
export const CLOSE_MOBILE_TOUR_MENU_EVENT = 'auri-close-mobile-tour-menu';

export const openPlatformTour = () => {
  window.dispatchEvent(new Event(OPEN_TOUR_EVENT));
};

export const openMobileTourMenu = () => {
  window.dispatchEvent(new Event(OPEN_MOBILE_TOUR_MENU_EVENT));
};

export const closeMobileTourMenu = () => {
  window.dispatchEvent(new Event(CLOSE_MOBILE_TOUR_MENU_EVENT));
};
