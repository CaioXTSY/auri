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
import type { AdminStats, TimeseriesPoint, TopLists } from '@/services/admin-service';

interface AdminDashboardChartsProps {
  stats: AdminStats;
  timeseries: TimeseriesPoint[];
  tops: TopLists;
}

const ROLE_COLORS: Record<string, string> = {
  ALUNO: '#2563eb',
  PROFESSOR: '#f59e0b',
  ADMIN: '#dc2626',
};

const formatDay = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const AdminDashboardCharts = ({
  stats,
  timeseries,
  tops,
}: AdminDashboardChartsProps) => {
  const roleChart = Object.entries(stats.users.byRole).map(([role, value]) => ({
    name: role,
    value,
    color: ROLE_COLORS[role] ?? '#64748b',
  }));

  const timeseriesFormatted = timeseries.map((point) => ({
    ...point,
    dayLabel: formatDay(point.date),
    total: point.correct + point.wrong,
  }));

  const last7Missions = timeseriesFormatted.slice(-7);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Top 5 turmas por alunos">
          {tops.topClasses.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Sem dados.</p>
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
            <p className="py-8 text-center text-sm text-slate-500">Sem dados.</p>
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
    </>
  );
};

const ChartCard = ({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-700">{title}</h3>
    {children}
  </div>
);
