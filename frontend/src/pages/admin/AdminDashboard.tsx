import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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

const ROLE_COLORS: Record<string, string> = {
  ALUNO: '#2563eb',
  PROFESSOR: '#f59e0b',
  ADMIN: '#dc2626',
};

const formatDay = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

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

  const roleChart = Object.entries(stats.users.byRole).map(([role, value]) => ({
    name: role,
    value,
    color: ROLE_COLORS[role] ?? '#64748b',
  }));

  const timeseriesFormatted = timeseries.map((p) => ({
    ...p,
    dayLabel: formatDay(p.date),
    total: p.correct + p.wrong,
  }));

  const last7Missions = timeseriesFormatted.slice(-7);

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Crescimento de usuários (30d)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timeseriesFormatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="users" name="Novos usuários" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Usuários por role">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={roleChart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {roleChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Missões criadas (7d)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={last7Missions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="missions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Quiz: acertos vs erros (30d)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={timeseriesFormatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="correct" name="Acertos" stackId="q" fill="#10b981" />
                <Bar dataKey="wrong" name="Erros" stackId="q" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Top 5 turmas por alunos">
            {tops.topClasses.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={tops.topClasses} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={120} />
                  <Tooltip />
                  <Bar dataKey="students" name="Alunos" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Top 5 conquistas desbloqueadas">
            {tops.topAchievements.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={tops.topAchievements} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={140} />
                  <Tooltip />
                  <Bar dataKey="unlocks" name="Desbloqueios" fill="#eab308" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
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

const ChartCard = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-slate-200 shadow-sm p-5 ${className}`}>
    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest mb-3">{title}</h3>
    {children}
  </div>
);
