import { useEffect, useMemo, useState } from 'react';
import { Trophy, Star, Medal, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  gamificationService,
  type PaginatedAchievements,
  type RankingEntry,
  type UserStats,
} from '@/services/gamification-service';

export const AchievementsPage = () => {
  const [achievements, setAchievements] = useState<PaginatedAchievements | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [globalRanking, setGlobalRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAchievementsLoading, setIsAchievementsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [statsData, rankingData] = await Promise.all([
          gamificationService.getMyStats(),
          gamificationService.getRanking('GLOBAL', undefined, 10),
        ]);
        setStats(statsData);
        setGlobalRanking(rankingData);
      } catch {
        setStats(null);
        setGlobalRanking([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    const loadAchievements = async () => {
      setIsAchievementsLoading(true);
      try {
        const data = await gamificationService.getMyAchievements(page, 6, filter);
        setAchievements(data);
      } catch {
        setAchievements(null);
      } finally {
        setIsAchievementsLoading(false);
      }
    };

    void loadAchievements();
  }, [filter, page]);

  const achievementProgress = useMemo(() => {
    if (!stats?.totalAchievements) return 0;
    return Math.round((stats.achievementsCount / stats.totalAchievements) * 100);
  }, [stats?.achievementsCount, stats?.totalAchievements]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {isLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500">Conquistas Desbloqueadas</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats?.achievementsCount}{' '}
                    <span className="text-sm font-normal text-slate-400">
                      / {stats?.totalAchievements}
                    </span>
                  </p>
                  <div className="mt-2">
                    <ProgressBar value={achievementProgress} variant="xp" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Pontuação Total</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.currentXp || 0} XP</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <Medal className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Nível Atual</p>
                  <div className="flex flex-col">
                    <p className="text-lg font-bold text-slate-900">
                      {stats?.levelName || 'Iniciante'}
                    </p>
                    {stats && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-purple-600 transition-all duration-500"
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Trophy className="h-5 w-5 text-brand-600" />
                Minhas Conquistas
              </h2>

              <div className="flex rounded-lg bg-slate-100 p-1">
                {(['ALL', 'UNLOCKED', 'LOCKED'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFilter(value);
                      setPage(1);
                    }}
                    className={cn(
                      'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
                      filter === value
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    {value === 'ALL'
                      ? 'Todas'
                      : value === 'UNLOCKED'
                        ? 'Desbloqueadas'
                        : 'Bloqueadas'}
                  </button>
                ))}
              </div>
            </div>

            {isAchievementsLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {achievements?.data.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      locked={!achievement.isUnlocked}
                    />
                  ))}

                  {achievements?.data.length === 0 && (
                    <div className="col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500">
                      Nenhuma conquista encontrada nesta categoria.
                    </div>
                  )}
                </div>

                {achievements && achievements.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <p className="text-sm text-slate-500">
                      Mostrando {(achievements.meta.page - 1) * achievements.meta.limit + 1} até{' '}
                      {Math.min(
                        achievements.meta.page * achievements.meta.limit,
                        achievements.meta.total,
                      )}{' '}
                      de {achievements.meta.total}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={achievements.meta.page <= 1}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((current) => current + 1)}
                        disabled={!achievements.meta.hasNextPage}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-6">
            <Leaderboard entries={globalRanking} title="Ranking Global" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
