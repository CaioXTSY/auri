export const OPEN_TOUR_EVENT = 'auri-open-platform-tour';

export const openPlatformTour = () => {
  window.dispatchEvent(new Event(OPEN_TOUR_EVENT));
};
