import { lazy, Suspense, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  adminService,
  type AdminStats,
  type TimeseriesPoint,
  type TopLists,
} from '@/services/admin-service';
import {
  Loader2,
  Users,
  GraduationCap,
  Target,
  MessageSquare,
  Trophy,
  Sparkles,
  CheckCircle2,
  Flame,
  Activity,
} from 'lucide-react';

const AdminDashboardCharts = lazy(() =>
  import('@/components/admin/AdminDashboardCharts').then((module) => ({
    default: module.AdminDashboardCharts,
  })),
);

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [tops, setTops] = useState<TopLists | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      adminService.getStats(),
      adminService.getTimeseries(),
      adminService.getTopLists(),
    ])
      .then(([s, t, tl]) => {
        if (!mounted) return;
        setStats(s);
        setTimeseries(t);
        setTops(tl);
      })
      .catch(() => mounted && setError('Falha ao carregar estatísticas'))
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !stats || !tops) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          {error ?? 'Erro desconhecido'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 font-display">Painel Admin</h1>
          <p className="text-slate-500">Visão geral da plataforma AURI.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Kpi icon={<Users className="w-4 h-4" />} label="Usuários" value={stats.users.total} hint={`+${stats.users.newLast7d} em 7d`} />
          <Kpi icon={<Activity className="w-4 h-4" />} label="Ativos 7d" value={stats.users.activeLast7d} />
          <Kpi icon={<GraduationCap className="w-4 h-4" />} label="Turmas" value={stats.classes.total} />
          <Kpi icon={<Target className="w-4 h-4" />} label="Missões hoje" value={stats.missions.createdToday} />
          <Kpi icon={<Sparkles className="w-4 h-4" />} label="Gerações IA 7d" value={stats.aiGenerations.last7d} />
          <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Acerto do quiz" value={`${(stats.quiz.accuracy * 100).toFixed(1)}%`} hint={`${stats.quiz.totalAttempts} tentativas`} />
          <Kpi icon={<Trophy className="w-4 h-4" />} label="Conquistas" value={stats.achievements.total} />
          <Kpi icon={<MessageSquare className="w-4 h-4" />} label="Posts" value={stats.posts.total} />
          <Kpi icon={<Flame className="w-4 h-4" />} label="Streak médio" value={stats.streaks.averageCurrent.toFixed(1)} hint="alunos" />
        </div>

        <Suspense fallback={<ChartsSkeleton />}>
          <AdminDashboardCharts stats={stats} timeseries={timeseries} tops={tops} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
};

const Kpi = ({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number | string; hint?: string }) => (
  <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
    <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest font-semibold">
      {icon}
      <span>{label}</span>
    </div>
    <div className="mt-2 text-2xl font-bold text-brand-900">{value}</div>
    {hint && <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>}
  </div>
);

const ChartsSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="mt-4 h-[260px] animate-pulse rounded bg-slate-100" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="mt-4 h-[260px] animate-pulse rounded bg-slate-100" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-[240px] animate-pulse rounded bg-slate-100" />
      </div>
      <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-56 rounded bg-slate-200" />
        <div className="mt-4 h-[240px] animate-pulse rounded bg-slate-100" />
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-44 rounded bg-slate-200" />
        <div className="mt-4 h-[240px] animate-pulse rounded bg-slate-100" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-52 rounded bg-slate-200" />
        <div className="mt-4 h-[240px] animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  </div>
);
