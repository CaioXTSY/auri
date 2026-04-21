import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, Medal, Target, BookOpen, Plus, Users, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useAuthStore } from '@/stores/auth-store';
import { dashboardService } from '@/services/dashboard-service';
import { classService } from '@/services/class-service';
import { STREAK_MILESTONES } from '@/constants/app';

const ProfessorDashboard = ({ firstName }: { firstName: string }) => {
  const navigate = useNavigate();

  const { data: classes, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => classService.getAllClasses(),
  });

  const totalStudents = classes?.reduce((sum, c) => sum + (c._count?.students ?? 0), 0) ?? 0;
  const activeClasses = classes?.filter((c) => c.status === 'ATIVA') ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Painel do Professor</p>
            <h2 className="mt-1 text-2xl font-display font-bold text-brand-900">
              Bem-vindo, {firstName}.
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Gerencie suas turmas e acompanhe os alunos abaixo.
            </p>
          </div>
          <Button
            className="bg-brand-900 hover:bg-brand-800 text-white font-semibold shrink-0"
            onClick={() => navigate('/dashboard/teacher/classes/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Turma
          </Button>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em] flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Turmas
            </p>
            {isLoading ? (
              <Skeleton className="h-9 w-16 mt-2" />
            ) : (
              <p className="text-4xl font-display font-bold text-brand-900 mt-2">{classes?.length ?? 0}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">{activeClasses.length} ativa{activeClasses.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em] flex items-center gap-2">
              <Users className="h-4 w-4" /> Alunos
            </p>
            {isLoading ? (
              <Skeleton className="h-9 w-16 mt-2" />
            ) : (
              <p className="text-4xl font-display font-bold text-brand-900 mt-2">{totalStudents}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">matriculados no total</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em] flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Postagens
            </p>
            <p className="text-xs text-slate-400 mt-2">Acesse postagens das suas turmas no menu lateral.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-fit"
              onClick={() => navigate('/dashboard/posts')}
            >
              Ver Postagens
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-brand-900 font-display">Suas Turmas</h3>
            <Link
              to="/dashboard/teacher/classes"
              className="text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
            >
              Ver todas →
            </Link>
          </div>

          {isError && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <span>Não foi possível carregar as turmas.</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="ml-auto shrink-0 font-semibold underline underline-offset-2 hover:text-red-800"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !isError && (classes?.length ?? 0) === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 border-dashed p-8 text-center text-slate-500 text-sm">
              Você ainda não criou nenhuma turma.{' '}
              <button
                type="button"
                onClick={() => navigate('/dashboard/teacher/classes/new')}
                className="font-semibold text-brand-700 hover:text-brand-900"
              >
                Criar agora →
              </button>
            </div>
          )}

          {!isLoading && !isError && (classes?.length ?? 0) > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(classes ?? []).slice(0, 6).map((cls) => (
                <Link
                  key={cls.id}
                  to={`/dashboard/teacher/classes/${cls.id}`}
                  className="block group bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-accent-200 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                      {cls.semester} • {cls.year}
                    </span>
                    <span className={`w-2 h-2 rounded-full mt-1 ${cls.status === 'ATIVA' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <h4 className="font-bold text-slate-800 group-hover:text-brand-700 transition-colors">{cls.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{cls._count?.students ?? 0} aluno{(cls._count?.students ?? 0) !== 1 ? 's' : ''}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export const DashboardHome = () => {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Aluno';

  const {
    data: dashboardData,
    isLoading,
    isError: loadError,
    refetch: loadDashboardData,
  } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => dashboardService.getStudentDashboard(),
    enabled: user?.role === 'ALUNO',
  });

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

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'PROFESSOR') {
    return <ProfessorDashboard firstName={firstName} />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {loadError && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <span>Não foi possível carregar os dados do dashboard.</span>
            <button
              type="button"
              onClick={() => loadDashboardData()}
              className="ml-auto shrink-0 font-semibold underline underline-offset-2 hover:text-red-800"
            >
              Tentar novamente
            </button>
          </div>
        )}
        {isLoading && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 space-y-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-3.5 w-full max-w-sm" />
              <Skeleton className="h-9 w-36 mt-2 rounded-lg" />
              <div className="pt-4 flex items-end justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="flex-1 max-w-xs space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              </div>
            </div>
            <div className="bg-brand-900 rounded-xl border border-brand-800 shadow-sm px-6 py-5 space-y-4">
              <Skeleton className="h-3 w-28 bg-brand-700" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-brand-700" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20 bg-brand-700" />
                  <Skeleton className="h-3 w-24 bg-brand-700" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-full rounded-full bg-brand-700" />
              </div>
            </div>
          </section>
        )}

        {isLoading && (
          <section className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <Skeleton className="h-3.5 w-36" />
                <div className="space-y-3 mt-2">
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
        )}

        {!isLoading && <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
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
                <ProgressBar value={progress} variant="xp" size="md" />
              </div>
            </div>
          </div>

          <div className="bg-brand-900 rounded-xl border border-brand-800 shadow-sm px-6 py-5 text-brand-50 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-accent-300 uppercase tracking-[0.2em]">
                Sequência Diária
              </p>
              {(dashboardData?.streak?.longest ?? 0) > 0 && (
                <p className="text-xs text-brand-300">
                  Recorde: <span className="text-brand-100 font-semibold">{dashboardData?.streak?.longest} {(dashboardData?.streak?.longest ?? 0) === 1 ? 'dia' : 'dias'}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-4xl leading-none">
                {(dashboardData?.streak?.current ?? 0) > 0 ? '🔥' : '🌑'}
              </span>
              <div>
                <p className="text-3xl font-display font-bold text-white leading-none">
                  {dashboardData?.streak?.current ?? 0}
                  <span className="ml-1.5 text-base font-normal text-brand-300">
                    {(dashboardData?.streak?.current ?? 0) === 1 ? 'dia' : 'dias'}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-brand-300">
                  {(dashboardData?.streak?.current ?? 0) === 0
                    ? 'Nenhuma sequência ativa'
                    : 'consecutivos'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand-400 font-semibold">Últimos 7 dias</p>
              <div className="flex gap-1.5">
                {Array.from({ length: 7 }, (_, i) => {
                  const streak = dashboardData?.streak?.current ?? 0;
                  const lastDate = dashboardData?.streak?.lastDate ? new Date(dashboardData.streak.lastDate) : null;
                  const today = new Date(); today.setHours(0, 0, 0, 0);
                  const lastDay = lastDate ? new Date(lastDate) : null;
                  if (lastDay) lastDay.setHours(0, 0, 0, 0);
                  const diffDays = lastDay ? Math.round((today.getTime() - lastDay.getTime()) / 86400000) : 999;
                  const streakActive = diffDays <= 1;
                  const filledFromRight = streakActive ? streak : 0;
                  const filled = i >= (7 - filledFromRight);
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full transition-all ${filled ? 'bg-accent-400' : 'bg-brand-700'}`}
                    />
                  );
                })}
              </div>
            </div>

            {(() => {
              const current = dashboardData?.streak?.current ?? 0;
              if (current === 0) {
                return (
                  <button
                    type="button"
                    onClick={openDailyQuiz}
                    className="text-xs font-semibold text-accent-400 hover:text-accent-300 text-left transition-colors"
                  >
                    Responda o quiz diário para começar →
                  </button>
                );
              }
              const nextMilestone = STREAK_MILESTONES.find((m) => m > current);
              if (!nextMilestone) {
                return (
                  <p className="text-xs text-amber-300 font-semibold">
                    👑 Você atingiu o marco máximo de 100 dias!
                  </p>
                );
              }
              const prevMilestone = STREAK_MILESTONES[STREAK_MILESTONES.indexOf(nextMilestone) - 1] ?? 0;
              const segmentProgress = Math.round(((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100);
              const daysLeft = nextMilestone - current;
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-brand-400 uppercase tracking-[0.18em] font-semibold">
                    <span>Próximo marco</span>
                    <span className="text-brand-200">{nextMilestone} dias</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-brand-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-400 transition-all duration-500"
                      style={{ width: `${segmentProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-brand-300">
                    {daysLeft === 1
                      ? 'Falta só 1 dia — você consegue! 🔥'
                      : `Faltam ${daysLeft} dias — continue assim!`}
                  </p>
                </div>
              );
            })()}
          </div>
        </section>}

        {!isLoading && <section className="grid gap-6 lg:grid-cols-3">
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

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.18em] flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" />
              Missões
            </h3>

            <div className="flex items-end gap-3">
              <p className="text-5xl font-display font-bold text-brand-900 leading-none">
                {missions?.completed ?? 0}
              </p>
              <p className="text-sm text-slate-500 mb-1 leading-tight">
                {(missions?.completed ?? 0) === 1 ? 'missão' : 'missões'}<br />concluídas
              </p>
            </div>

            {(missions?.completed ?? 0) === 0 ? (
              <p className="text-xs text-slate-400">
                Complete missões para acumular XP e subir no ranking.
              </p>
            ) : (
              <div className="space-y-1.5">
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, missions?.completionRate ?? 0)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {missions?.completionRate ?? 0}% das missões disponíveis concluídas
                </p>
              </div>
            )}

            <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={openDailyQuiz}
                className="text-xs font-semibold text-accent-600 hover:text-accent-700 transition-colors flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Quiz do dia
              </button>
              <Link
                to="/dashboard/missions"
                className="text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
              >
                Ver todas →
              </Link>
            </div>
          </div>
        </section>}
      </div>
    </DashboardLayout>
  );
};

