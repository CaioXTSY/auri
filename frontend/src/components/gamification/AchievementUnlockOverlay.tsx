import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { gamificationService, type Achievement } from '@/services/gamification-service';
import {
  CHECK_ACHIEVEMENT_UNLOCKS_EVENT,
  PENDING_ACHIEVEMENT_UNLOCK_CHECK_KEY,
} from './achievement-unlock-events';

interface AchievementUnlockOverlayProps {
  userId: string | undefined;
  enabled?: boolean;
}

const getStorageKey = (userId: string) => `auri-achievements-seen:${userId}:v1`;

export const AchievementUnlockOverlay = ({
  userId,
  enabled = true,
}: AchievementUnlockOverlayProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [queue, setQueue] = useState<Achievement[]>([]);

  const storageKey = useMemo(() => {
    if (!userId) return null;
    return getStorageKey(userId);
  }, [userId]);

  const getSeenIds = useCallback(() => {
    if (!storageKey) return [];

    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === 'string')
        : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  const saveSeenIds = useCallback(
    (ids: string[]) => {
      if (!storageKey) return;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(new Set(ids))));
    },
    [storageKey],
  );

  const hasPendingCheck = useCallback(() => {
    try {
      return window.sessionStorage.getItem(PENDING_ACHIEVEMENT_UNLOCK_CHECK_KEY) === '1';
    } catch {
      return false;
    }
  }, []);

  const clearPendingCheck = useCallback(() => {
    try {
      window.sessionStorage.removeItem(PENDING_ACHIEVEMENT_UNLOCK_CHECK_KEY);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const activeUnlock = queue[0] ?? null;

  useEffect(() => {
    if (!enabled || !userId || !storageKey || isInitialized) return;

    let cancelled = false;

    const initialize = async () => {
      const shouldEnqueue = hasPendingCheck();

      try {
        const unlocked = await gamificationService.getLatestUnlockedAchievements(10);
        if (cancelled) return;

        if (shouldEnqueue) {
          const seenIds = new Set(getSeenIds());
          const additions = unlocked.filter(
            (achievement) => Boolean(achievement.unlockedAt) && !seenIds.has(achievement.id),
          );

          if (additions.length > 0) {
            setQueue(additions);
          }

          clearPendingCheck();
        } else {
          saveSeenIds(unlocked.map((achievement) => achievement.id));
        }
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [
    clearPendingCheck,
    enabled,
    getSeenIds,
    hasPendingCheck,
    isInitialized,
    saveSeenIds,
    storageKey,
    userId,
  ]);

  useEffect(() => {
    if (!enabled || !isInitialized) return;

    const handleCheck = () => {
      void (async () => {
        try {
          const unlocked = await gamificationService.getLatestUnlockedAchievements(10);
          const seenIds = new Set(getSeenIds());

          setQueue((current) => {
            const pendingIds = new Set(current.map((achievement) => achievement.id));
            const additions = unlocked.filter(
              (achievement) =>
                Boolean(achievement.unlockedAt) &&
                !seenIds.has(achievement.id) &&
                !pendingIds.has(achievement.id),
            );

            return additions.length > 0 ? [...current, ...additions] : current;
          });

          clearPendingCheck();
        } catch {
          // Ignore transient fetch failures; the next qualifying action will retry.
        }
      })();
    };

    window.addEventListener(CHECK_ACHIEVEMENT_UNLOCKS_EVENT, handleCheck);
    return () => window.removeEventListener(CHECK_ACHIEVEMENT_UNLOCKS_EVENT, handleCheck);
  }, [clearPendingCheck, enabled, getSeenIds, isInitialized]);

  const handleClose = useCallback(() => {
    if (activeUnlock) {
      saveSeenIds([...getSeenIds(), activeUnlock.id]);
    }

    setQueue((current) => current.slice(1));
  }, [activeUnlock, getSeenIds, saveSeenIds]);

  if (!enabled || !activeUnlock) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[1000000002] w-[calc(100%-2rem)] max-w-sm">
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.38)]">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400" />
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-600">
              {activeUnlock.icon || '🏆'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                Nova conquista
              </p>
              <h3 className="truncate text-base font-bold text-slate-900">{activeUnlock.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{activeUnlock.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                +{activeUnlock.points} XP
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {activeUnlock.rarity}
              </span>
            </div>

            <Button
              type="button"
              size="sm"
              className="bg-brand-900 text-white hover:bg-brand-800"
              onClick={handleClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
