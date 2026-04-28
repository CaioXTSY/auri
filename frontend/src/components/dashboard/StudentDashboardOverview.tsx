import { Link } from 'react-router-dom';
import { Medal, Sparkles, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { STREAK_MILESTONES } from '@/constants/app';
import type { StudentDashboard } from '@/services/dashboard-service';

interface StudentDashboardOverviewProps {
  firstName: string;
  dashboardData?: StudentDashboard;
  isLoading: boolean;
  loadError: boolean;
  onRetry: () => void;
  onOpenDailyQuiz: () => void;
}

const getStreakSegment = (current: number) => {
  const nextMilestone = STREAK_MILESTONES.find((milestone) => milestone > current);
  if (!nextMilestone) {
    return { nextMilestone: null, daysLeft: 0, segmentProgress: 100 };
  }

  const previousMilestone = STREAK_MILESTONES[STREAK_MILESTONES.indexOf(nextMilestone) - 1] ?? 0;
  const segmentProgress = Math.round(
    ((current - previousMilestone) / (nextMilestone - previousMilestone)) * 100,
  );

  return {
    nextMilestone,
    daysLeft: nextMilestone - current,
    segmentProgress,
  };
};

export const StudentDashboardOverview = ({
  firstName,
  dashboardData,
  isLoading,
  loadError,
  onRetry,
  onOpenDailyQuiz,
}: StudentDashboardOverviewProps) => {
  const levelInfo = dashboardData?.level ?? null;
  const level = levelInfo?.currentLevel ?? 0;
  const currentXp = levelInfo?.totalPoints ?? 0;
  const recentAchievements = dashboardData?.achievements.recent ?? [];
  const rankingGlobal = dashboardData?.ranking.global;
  const rankingClass = dashboardData?.ranking.class;
  const missions = dashboardData?.missions;
  const streakCurrent = dashboardData?.streak?.current ?? 0;
  const nextLevelXp =
    levelInfo && levelInfo.pointsInCurrentLevel + levelInfo.pointsNeededForNextLevel > 0
      ? levelInfo.pointsInCurrentLevel + levelInfo.pointsNeededForNextLevel
      : 0;
  const progress = levelInfo?.progressToNextLevel
    ? Math.min(100, Math.max(0, Math.round(levelInfo.progressToNextLevel)))
    : 0;
  const { nextMilestone, daysLeft, segmentProgress } = getStreakSegment(streakCurrent);

  return (
    <div className="space-y-8">
      {loadError ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>Não foi possível carregar os dados do dashboard.</span>
          <button type="button" onClick={onRetry} className="ml-auto shrink-0 font-semibold underline underline-offset-2 hover:text-red-800">
            Tentar novamente
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <>
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-3.5 w-full max-w-sm" />
              <Skeleton className="mt-2 h-9 w-36 rounded-lg" />
              <div className="flex items-end justify-between gap-4 pt-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="max-w-xs flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              </div>
            </div>
            <div className="space-y-4 rounded-xl border border-brand-800 bg-brand-900 px-6 py-5 shadow-sm">
              <Skeleton className="h-3 w-28 bg-brand-700" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-brand-700" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20 bg-brand-700" />
                  <Skeleton className="h-3 w-24 bg-brand-700" />
                </div>
              </div>
              <Skeleton className="h-2.5 w-full rounded-full bg-brand-700" />
            </div>
          </section>
          <section className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <Skeleton className="h-3.5 w-36" />
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-2/5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </>
      ) : null}

      {!isLoading ? (
        <>
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Jornada Atual</p>
                <h2 className="mt-2 text-2xl font-display font-bold text-brand-900">Bem-vindo de volta, {firstName}.</h2>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  Continue evoluindo sua trilha. Participe das turmas, acumule pontos e avance de nível na AURI.
                </p>
                <Button type="button" className="mt-4 w-fit bg-brand-900 font-semibold text-white hover:bg-brand-800" onClick={onOpenDailyQuiz} data-tour="daily-quiz">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ver quiz diário
                </Button>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nível Atual</p>
                  <p className="mt-1 text-4xl font-display font-bold text-accent-600">Nível {level}</p>
                  {levelInfo ? <p className="mt-1 text-xs text-slate-500">{currentXp} XP de {nextLevelXp} XP para o próximo nível</p> : null}
                </div>
                <div className="max-w-xs flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Progresso</span>
                    <span className="text-xs font-semibold text-brand-900">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} variant="xp" size="md" />
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-xl border border-brand-800 bg-brand-900 px-6 py-5 text-brand-50 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-300">Sequência Diária</p>
                {(dashboardData?.streak?.longest ?? 0) > 0 ? (
                  <p className="text-xs text-brand-300">
                    Recorde: <span className="font-semibold text-brand-100">{dashboardData?.streak?.longest} {(dashboardData?.streak?.longest ?? 0) === 1 ? 'dia' : 'dias'}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-4xl leading-none">{streakCurrent > 0 ? '🔥' : '🌑'}</span>
                <div>
                  <p className="text-3xl font-display font-bold leading-none text-white">
                    {streakCurrent}
                    <span className="ml-1.5 text-base font-normal text-brand-300">{streakCurrent === 1 ? 'dia' : 'dias'}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-brand-300">{streakCurrent === 0 ? 'Nenhuma sequência ativa' : 'consecutivos'}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-400">Últimos 7 dias</p>
                <div className="flex gap-1.5">
                  {Array.from({ length: 7 }, (_, index) => {
                    const lastDate = dashboardData?.streak?.lastDate ? new Date(dashboardData.streak.lastDate) : null;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const lastDay = lastDate ? new Date(lastDate) : null;
                    if (lastDay) lastDay.setHours(0, 0, 0, 0);
                    const diffDays = lastDay ? Math.round((today.getTime() - lastDay.getTime()) / 86400000) : 999;
                    const streakActive = diffDays <= 1;
                    const filledFromRight = streakActive ? streakCurrent : 0;
                    const filled = index >= 7 - filledFromRight;

                    return <div key={index} className={`h-2 flex-1 rounded-full transition-all ${filled ? 'bg-accent-400' : 'bg-brand-700'}`} />;
                  })}
                </div>
              </div>

              {streakCurrent === 0 ? (
                <button type="button" onClick={onOpenDailyQuiz} className="text-left text-xs font-semibold text-accent-400 transition-colors hover:text-accent-300">
                  Responda o quiz diário para começar →
                </button>
              ) : nextMilestone == null ? (
                <p className="text-xs font-semibold text-amber-300">👑 Você atingiu o marco máximo de 100 dias!</p>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-400">
                    <span>Próximo marco</span>
                    <span className="text-brand-200">{nextMilestone} dias</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-700">
                    <div className="h-full rounded-full bg-accent-400 transition-all duration-500" style={{ width: `${segmentProgress}%` }} />
                  </div>
                  <p className="text-[11px] text-brand-300">
                    {daysLeft === 1 ? 'Falta só 1 dia — você consegue! 🔥' : `Faltam ${daysLeft} dias — continue assim!`}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                <Trophy className="h-4 w-4 text-amber-500" />
                Conquistas Recentes
              </h3>
              <div className="mt-4 space-y-3">
                {recentAchievements.length === 0 ? <p className="text-sm text-slate-500">Nenhuma conquista recente.</p> : null}
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600">
                      {achievement.icon || '🏆'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{achievement.name}</p>
                      <p className="text-xs text-slate-500">{achievement.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600">+{achievement.points}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                <Medal className="h-4 w-4 text-slate-500" />
                Ranking
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">🌍 Global</span>
                  <span className="text-lg font-bold text-slate-800">{rankingGlobal ? `#${rankingGlobal}` : '--'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">🧑‍🎓 Turma</span>
                  <span className="text-lg font-bold text-slate-800">{rankingClass ? `#${rankingClass}` : '--'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                <Target className="h-4 w-4 text-emerald-500" />
                Missões
              </h3>

              <div className="flex items-end gap-3">
                <p className="text-5xl font-display font-bold leading-none text-brand-900">{missions?.completed ?? 0}</p>
                <p className="mb-1 text-sm leading-tight text-slate-500">
                  {(missions?.completed ?? 0) === 1 ? 'missão' : 'missões'}<br />concluídas
                </p>
              </div>

              {(missions?.completed ?? 0) === 0 ? (
                <p className="text-xs text-slate-400">Complete missões para acumular XP e subir no ranking.</p>
              ) : (
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, missions?.completionRate ?? 0)}%` }} />
                  </div>
                  <p className="text-xs text-slate-400">{missions?.completionRate ?? 0}% das missões disponíveis concluídas</p>
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2">
                <button type="button" onClick={onOpenDailyQuiz} className="flex items-center gap-1 text-xs font-semibold text-accent-600 transition-colors hover:text-accent-700">
                  <Sparkles className="h-3 w-3" />
                  Quiz do dia
                </button>
                <Link to="/dashboard/missions" className="text-xs font-semibold text-brand-700 transition-colors hover:text-brand-900">
                  Ver todas →
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};
