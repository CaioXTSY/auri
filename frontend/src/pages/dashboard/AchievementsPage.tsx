import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { ProgressBar } from '@/components/ui/progress-bar';
import { gamificationService, type Achievement, type PaginatedAchievements, type RankingEntry, type UserStats } from '@/services/gamification-service';
import { Loader2, Trophy, Star, Medal, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export const AchievementsPage = () => {
  const [achievements, setAchievements] = useState<PaginatedAchievements | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [globalRanking, setGlobalRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAchievementsLoading, setIsAchievementsLoading] = useState(true);
  const [unlockQueue, setUnlockQueue] = useState<Achievement[]>([]);
  const [activeUnlock, setActiveUnlock] = useState<Achievement | null>(null);
  const user = useAuthStore((state) => state.user);

  // Pagination & Filter
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [statsData, rankingData] = await Promise.all([
          gamificationService.getMyStats(),
          gamificationService.getRanking('GLOBAL', undefined, 10)
        ]);
        setStats(statsData);
        setGlobalRanking(rankingData);
      } catch (error) {
        console.error('Failed to load gamification data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadAchievements = async () => {
      setIsAchievementsLoading(true);
      try {
        const data = await gamificationService.getMyAchievements(page, 6, filter);
        setAchievements(data);
        const userId = user?.id;
        if (userId) {
          const storageKey = `auri-achievements-seen-${userId}`;
          const seenRaw = localStorage.getItem(storageKey);
          let seenIds: string[] = [];
          if (seenRaw) {
            try {
              seenIds = JSON.parse(seenRaw);
            } catch {
              seenIds = [];
            }
          }
          const newlyUnlocked = data.data.filter(
            (achievement) =>
              achievement.isUnlocked &&
              achievement.unlockedAt &&
              !seenIds.includes(achievement.id),
          );
          if (newlyUnlocked.length > 0) {
            const mergedSeen = Array.from(new Set([...seenIds, ...newlyUnlocked.map((item) => item.id)]));
            localStorage.setItem(storageKey, JSON.stringify(mergedSeen));
            setUnlockQueue((current) => {
              const existingIds = new Set(current.map((item) => item.id));
              const additions = newlyUnlocked.filter((item) => !existingIds.has(item.id));
              return [...current, ...additions];
            });
          }
        }
      } catch (error) {
        console.error('Failed to load achievements', error);
      } finally {
        setIsAchievementsLoading(false);
      }
    };

    loadAchievements();
  }, [page, filter, user?.id]);

  useEffect(() => {
    if (!activeUnlock && unlockQueue.length > 0) {
      setActiveUnlock(unlockQueue[0]);
    }
  }, [activeUnlock, unlockQueue]);

  const handleCloseUnlock = () => {
    setUnlockQueue((current) => current.slice(1));
    setActiveUnlock(null);
  };

  const achievementProgress = useMemo(() => {
    if (!stats?.totalAchievements) return 0;
    return Math.round((stats.achievementsCount / stats.totalAchievements) * 100);
  }, [stats?.achievementsCount, stats?.totalAchievements]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 font-medium">Conquistas Desbloqueadas</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.achievementsCount} <span className="text-sm text-slate-400 font-normal">/ {stats?.totalAchievements}</span>
              </p>
              <div className="mt-2">
                <ProgressBar value={achievementProgress} variant="xp" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pontuação Total</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats?.currentXp || 0} XP
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <Medal className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Nível Atual</p>
              <div className="flex flex-col">
                <p className="text-lg font-bold text-slate-900">{stats?.levelName || 'Iniciante'}</p>
                {stats && (
                  <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Achievements List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-600" />
                Minhas Conquistas
              </h2>
              
              <div className="flex p-1 bg-slate-100 rounded-lg">
                {(['ALL', 'UNLOCKED', 'LOCKED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setPage(1); }}
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                      filter === f 
                        ? "bg-white text-brand-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {f === 'ALL' ? 'Todas' : f === 'UNLOCKED' ? 'Desbloqueadas' : 'Bloqueadas'}
                  </button>
                ))}
              </div>
            </div>
            
            {isAchievementsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements?.data.map((achievement) => (
                    <AchievementCard 
                      key={achievement.id} 
                      achievement={achievement} 
                      locked={!achievement.isUnlocked} 
                    />
                  ))}
                  
                  {achievements?.data.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Nenhuma conquista encontrada nesta categoria.
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {achievements && achievements.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-500">
                      Mostrando {((achievements.meta.page - 1) * achievements.meta.limit) + 1} até {Math.min(achievements.meta.page * achievements.meta.limit, achievements.meta.total)} de {achievements.meta.total}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={!achievements.meta.page || achievements.meta.page <= 1}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!achievements.meta.hasNextPage}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar Ranking */}
          <div className="space-y-6">
            <Leaderboard 
              entries={globalRanking} 
              title="Ranking Global" 
            />
          </div>
        </div>
      </div>

      {activeUnlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl">
                {activeUnlock.icon || '🏆'}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
                  Conquista desbloqueada
                </p>
                <h3 className="text-lg font-bold text-slate-900">{activeUnlock.name}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-600">{activeUnlock.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-amber-600">+{activeUnlock.points} XP</span>
              <span className="text-xs uppercase tracking-widest text-slate-400">
                {activeUnlock.rarity}
              </span>
            </div>
            <div className="flex justify-end">
              <Button type="button" className="bg-brand-900 hover:bg-brand-800 text-white" onClick={handleCloseUnlock}>
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
