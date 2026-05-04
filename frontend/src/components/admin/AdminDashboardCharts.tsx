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
  const maxUsers = Math.max(...timeseriesFormatted.map((point) => point.users), 1);
  const maxMissions = Math.max(...last7Missions.map((point) => point.missions), 1);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Crescimento de usuários (30d)" className="lg:col-span-2">
          <LineTrendChart
            data={timeseriesFormatted.map((point) => ({
              label: point.dayLabel,
              value: point.users,
            }))}
            maxValue={maxUsers}
            color="#2563eb"
            valueLabel="novos usuários"
          />
        </ChartCard>

        <ChartCard title="Usuários por role">
          <DonutChart data={roleChart} />
        </ChartCard>

        <ChartCard title="Missões criadas (7d)">
          <MiniBarChart
            data={last7Missions.map((point) => ({
              label: point.dayLabel,
              value: point.missions,
            }))}
            maxValue={maxMissions}
            colorClassName="bg-amber-500"
          />
        </ChartCard>

        <ChartCard title="Quiz: acertos vs erros (30d)" className="lg:col-span-2">
          <StackedBarSeries data={timeseriesFormatted} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <ChartCard title="Conquistas mais desbloqueadas">
          {tops.topAchievements.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Sem dados.</p>
          ) : (
            <RankedBarList
              items={tops.topAchievements.map((item) => ({
                label: item.name,
                value: item.unlocks,
              }))}
              colorClassName="bg-yellow-500"
              valueSuffix=" desbloqueios"
            />
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

const LineTrendChart = ({
  data,
  maxValue,
  color,
  valueLabel,
}: {
  data: Array<{ label: string; value: number }>;
  maxValue: number;
  color: string;
  valueLabel: string;
}) => {
  const width = 100;
  const height = 34;
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 0 : (index / (data.length - 1)) * width;
      const y = height - (item.value / maxValue) * height;
      return `${x},${Number.isFinite(y) ? y : height}`;
    })
    .join(' ');

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${width} ${height + 2}`} className="h-64 w-full" aria-label="Linha de crescimento de usuários">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 sm:grid-cols-6">
        {data.slice(-6).map((item) => (
          <div key={item.label} className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="font-semibold text-slate-700">{item.label}</div>
            <div>
              {item.value} {valueLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DonutChart = ({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const gradient = data
    .reduce<{ color: string; start: number; end: number }[]>((acc, item) => {
      const start = acc.length === 0 ? 0 : acc[acc.length - 1].end;
      const end = start + (total === 0 ? 0 : (item.value / total) * 100);
      acc.push({ color: item.color, start, end });
      return acc;
    }, [])
    .map((item) => `${item.color} ${item.start}% ${item.end}%`)
    .join(', ');

  return (
    <div className="flex flex-col items-center gap-5 py-4 lg:flex-row lg:items-start">
      <div
        className="relative h-44 w-44 rounded-full"
        style={{
          background: total === 0 ? '#e2e8f0' : `conic-gradient(${gradient})`,
        }}
        aria-label="Distribuição de usuários por perfil"
      >
        <div className="absolute inset-6 flex items-center justify-center rounded-full bg-white text-center">
          <div>
            <div className="text-2xl font-bold text-brand-900">{total}</div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Usuários</div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-slate-700">{item.name}</span>
            </div>
            <span className="text-slate-500">
              {item.value} • {total === 0 ? 0 : Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MiniBarChart = ({
  data,
  maxValue,
  colorClassName,
}: {
  data: Array<{ label: string; value: number }>;
  maxValue: number;
  colorClassName: string;
}) => (
  <div className="flex h-60 items-end gap-3">
    {data.map((item) => (
      <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
        <span className="text-xs font-semibold text-slate-700">{item.value}</span>
        <div className="flex h-44 w-full items-end rounded-xl bg-slate-100 px-1.5 py-1.5">
          <div
            className={`w-full rounded-lg ${colorClassName}`}
            style={{ height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0)}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-500">{item.label}</span>
      </div>
    ))}
  </div>
);

const StackedBarSeries = ({
  data,
}: {
  data: Array<{ dayLabel: string; correct: number; wrong: number; total: number }>;
}) => {
  const visible = data.slice(-10);

  return (
    <div className="space-y-3">
      {visible.map((item) => (
        <div key={item.dayLabel} className="grid grid-cols-[56px,1fr,72px] items-center gap-3 text-xs">
          <span className="font-medium text-slate-600">{item.dayLabel}</span>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="bg-emerald-500"
              style={{ width: `${item.total === 0 ? 0 : (item.correct / item.total) * 100}%` }}
            />
            <div
              className="bg-rose-500"
              style={{ width: `${item.total === 0 ? 0 : (item.wrong / item.total) * 100}%` }}
            />
          </div>
          <span className="text-right text-slate-500">
            {item.correct}/{item.wrong}
          </span>
        </div>
      ))}
      <div className="flex gap-4 pt-2 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Acertos
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Erros
        </span>
      </div>
    </div>
  );
};

const RankedBarList = ({
  items,
  colorClassName,
  valueSuffix,
}: {
  items: Array<{ label: string; value: number }>;
  colorClassName: string;
  valueSuffix: string;
}) => {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">{item.label}</span>
            <span className="shrink-0 text-xs text-slate-500">
              {item.value}
              {valueSuffix}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${colorClassName}`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
