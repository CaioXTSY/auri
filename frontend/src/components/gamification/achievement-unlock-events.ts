export const CHECK_ACHIEVEMENT_UNLOCKS_EVENT = 'auri-check-achievement-unlocks';
export const PENDING_ACHIEVEMENT_UNLOCK_CHECK_KEY = 'auri-pending-achievement-unlock-check';

export const checkAchievementUnlocks = () => {
  try {
    window.sessionStorage.setItem(PENDING_ACHIEVEMENT_UNLOCK_CHECK_KEY, '1');
  } catch {
    // Ignore storage failures and still try to dispatch the in-memory event.
  }

  try {
    window.dispatchEvent(new Event(CHECK_ACHIEVEMENT_UNLOCKS_EVENT));
  } catch {
    // Ignore dispatch failures; the pending flag allows retry on the next render path.
  }
};
