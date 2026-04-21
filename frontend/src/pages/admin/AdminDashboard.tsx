import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { adminService, type AdminStats } from '@/services/admin-service';
import { Loader2, Users, GraduationCap, Target, MessageSquare, Trophy, Sparkles } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    adminService
      .getStats()
      .then((data) => mounted && setStats(data))
      .catch(() => mounted && setError('Falha ao carregar estatísticas'))
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 font-display">Painel Admin</h1>
          <p className="text-slate-500">Visão geral da plataforma AURI.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={<Users className="w-5 h-5" />} label="Usuários" value={stats.users.total} hint={`+${stats.users.newLast7d} últimos 7d`} />
              <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Turmas" value={stats.classes.total} />
              <StatCard icon={<Target className="w-5 h-5" />} label="Missões hoje" value={stats.missions.createdToday} />
              <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Posts" value={stats.posts.total} />
              <StatCard icon={<Trophy className="w-5 h-5" />} label="Conquistas" value={stats.achievements.total} />
              <StatCard icon={<Sparkles className="w-5 h-5" />} label="Gerações IA (7d)" value={stats.aiGenerations.last7d} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel title="Usuários por role">
                <BreakdownList entries={Object.entries(stats.users.byRole)} />
              </Panel>
              <Panel title="Missões por tipo">
                <BreakdownList entries={Object.entries(stats.missions.byType)} />
              </Panel>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint?: string }) => (
  <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
    <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest font-semibold">
      {icon}
      <span>{label}</span>
    </div>
    <div className="mt-3 text-3xl font-bold text-brand-900">{value}</div>
    {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
  </div>
);

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest mb-3">{title}</h3>
    {children}
  </div>
);

const BreakdownList = ({ entries }: { entries: [string, number][] }) => (
  <ul className="space-y-2">
    {entries.length === 0 ? (
      <li className="text-sm text-slate-500">Sem dados.</li>
    ) : (
      entries.map(([key, value]) => (
        <li key={key} className="flex items-center justify-between text-sm">
          <span className="text-slate-700">{key}</span>
          <span className="font-semibold text-brand-900">{value}</span>
        </li>
      ))
    )}
  </ul>
);
