import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { gamificationService, type AchievementProgress, type RankingEntry, type UserStats } from '@/services/gamification-service';
import { Loader2, Trophy, Star, Medal } from 'lucide-react';

export const AchievementsPage = () => {
  const [achievements, setAchievements] = useState<AchievementProgress | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [globalRanking, setGlobalRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [achievementsData, statsData, rankingData] = await Promise.all([
          gamificationService.getMyAchievements(),
          gamificationService.getMyStats(),
          gamificationService.getRanking('GLOBAL', undefined, 10)
        ]);
        setAchievements(achievementsData);
        setStats(statsData);
        setGlobalRanking(rankingData);
      } catch (error) {
        console.error('Failed to load gamification data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
            <div>
              <p className="text-sm text-slate-500 font-medium">Conquistas Desbloqueadas</p>
              <p className="text-2xl font-bold text-slate-900">
                {achievements?.unlockedCount} <span className="text-sm text-slate-400 font-normal">/ {achievements?.total}</span>
              </p>
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
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-600" />
                Minhas Conquistas
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements?.unlocked.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
                {achievements?.locked.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} locked />
                ))}
              </div>
            </div>
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
    </DashboardLayout>
  );
};
