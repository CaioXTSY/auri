import { useEffect, useState } from 'react';
import { Sparkles, Trophy, Medal, Target, CheckCircle2, Hourglass } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { dashboardService, type StudentDashboard } from '@/services/dashboard-service';

export const DashboardHome = () => {
  const user = useAuthStore((state) => state.user);

  const [dashboardData, setDashboardData] = useState<StudentDashboard | null>(null);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Aluno';

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      // Professores não têm dashboard de aluno (gamificação/atividades) por enquanto
      if (user?.role === 'PROFESSOR') {
        return;
      }

      try {
        const dashboardResponse = await dashboardService.getStudentDashboard();

        if (!isMounted) return;

        setDashboardData(dashboardResponse);
      } catch (loadError) {
        if (!isMounted) return;
        console.error(loadError);
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  const levelInfo = dashboardData?.level ?? null;
  const level = levelInfo?.currentLevel ?? 0;
  const currentXp = levelInfo?.totalPoints ?? 0;
  const recentAchievements = dashboardData?.achievements.recent ?? [];
  const rankingGlobal = dashboardData?.ranking.global;
  const rankingClass = dashboardData?.ranking.class;
  const missions = dashboardData?.missions;
  const nextLevelXp =
    levelInfo && levelInfo.pointsInCurrentLevel + levelInfo.pointsNeededForNextLevel > 0
      ? levelInfo.pointsInCurrentLevel + levelInfo.pointsNeededForNextLevel
      : 0;

  const progress = levelInfo?.progressToNextLevel ? Math.min(100, Math.max(0, Math.round(levelInfo.progressToNextLevel))) : 0;

  const openDailyQuiz = () => {
    window.dispatchEvent(new Event('open-daily-quiz'));
  };

  if (user?.role === 'PROFESSOR') {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-8">
            <h2 className="text-2xl font-display font-bold text-brand-900">
              Bem-vindo, Professor {firstName}.
            </h2>
            <p className="mt-2 text-slate-600">
              Gerencie suas turmas através do menu lateral.
            </p>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 flex flex-col justify-between">
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
                Jornada Atual
              </p>
              <h2 className="mt-2 text-2xl font-display font-bold text-brand-900">
                Bem-vindo de volta, {firstName}.
              </h2>
              <p className="mt-2 text-sm text-slate-600 max-w-md">
                Continue evoluindo sua trilha. Participe das turmas, acumule pontos e avance de nível
                na AURI.
              </p>
              <Button
                type="button"
                className="mt-4 bg-brand-900 hover:bg-brand-800 text-white font-semibold w-fit"
                onClick={openDailyQuiz}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ver quiz diário
              </Button>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em]">
                  Nível Atual
                </p>
                <p className="mt-1 text-4xl font-display font-bold text-accent-600">
                  Nível {level}
                </p>
                {levelInfo && (
                  <p className="mt-1 text-xs text-slate-500">
                    {currentXp} XP de {nextLevelXp} XP para o próximo nível
                  </p>
                )}
              </div>
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-[0.16em]">
                    Progresso
                  </span>
                  <span className="text-xs font-semibold text-brand-900">
                    {progress}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-900 rounded-xl border border-brand-800 shadow-sm px-6 py-5 text-brand-50">
            <p className="text-xs font-semibold text-accent-300 uppercase tracking-[0.2em]">
              Meta da Semana
            </p>
            <h2 className="mt-2 text-xl font-display font-bold">
              Complete suas missões diárias e suba no ranking.
            </h2>
            <p className="mt-2 text-sm text-brand-100">
              Mantenha o foco em suas missões para garantir o bônus de XP semanal.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="flex-1 h-1.5 bg-brand-800 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-accent-500 rounded-full" />
              </div>
              <span className="font-semibold text-accent-200">1 de 3 concluídas</span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.18em] flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Conquistas Recentes
            </h3>
            <div className="mt-4 space-y-3">
              {recentAchievements.length === 0 && (
                <p className="text-sm text-slate-500">Nenhuma conquista recente.</p>
              )}
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg">
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

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.18em] flex items-center gap-2">
              <Medal className="h-4 w-4 text-slate-500" />
              Ranking
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-[0.16em] flex items-center gap-2">
                  🌍 Global
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {rankingGlobal ? `#${rankingGlobal}` : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-[0.16em] flex items-center gap-2">
                  🧑‍🎓 Turma
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {rankingClass ? `#${rankingClass}` : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.18em] flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-500" />
                Missões
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-[0.16em] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Concluídas
                  </p>
                  <p className="text-lg font-bold text-slate-800">{missions?.completed ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-[0.16em] flex items-center gap-1">
                    <Hourglass className="h-3 w-3 text-amber-500" />
                    Em andamento
                  </p>
                  <p className="text-lg font-bold text-slate-800">{missions?.inProgress ?? 0}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Taxa de conclusão: {missions?.completionRate ?? 0}%
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

