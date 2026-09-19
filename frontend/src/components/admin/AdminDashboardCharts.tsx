import type { AdminStats, TimeseriesPoint, TopLists } from '@/services/admin-service';

interface AdminDashboardChartsProps {
  stats: AdminStats;
  timeseries: TimeseriesPoint[];
  tops: TopLists;
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  ALUNO: { label: 'Alunos', color: '#2563eb' },
  PROFESSOR: { label: 'Professores', color: '#f59e0b' },
  ADMIN: { label: 'Administradores', color: '#7c3aed' },
};

const formatDay = (iso: string) => {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(date)
    .replace('.', '');
};

const pluralize = (value: number, singular: string, plural = `${singular}s`) =>
  `${value} ${value === 1 ? singular : plural}`;

export const AdminDashboardCharts = ({ stats, timeseries, tops }: AdminDashboardChartsProps) => {
  const formatted = timeseries.map((point) => ({
    ...point,
    dayLabel: formatDay(point.date),
    totalQuiz: point.correct + point.wrong,
  }));
  const userActivity = formatted.slice(-14);
  const missionActivity = formatted.slice(-7);
  const newUsers = formatted.reduce((total, point) => total + point.users, 0);
  const missionsLast7Days = missionActivity.reduce((total, point) => total + point.missions, 0);
  const quizLast30Days = formatted.reduce((total, point) => total + point.totalQuiz, 0);
  const quizCorrectLast30Days = formatted.reduce((total, point) => total + point.correct, 0);
  const activeQuizDays = formatted.filter((point) => point.totalQuiz > 0).slice(-4).reverse();

  const roleData = ['ALUNO', 'PROFESSOR', 'ADMIN'].map((role) => ({
    role,
    value: stats.users.byRole[role] ?? 0,
    ...ROLE_META[role],
  }));

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Crescimento da comunidade"
          subtitle="Novos cadastros nos últimos 14 dias"
          action={`${pluralize(newUsers, 'novo usuário', 'novos usuários')} em 30 dias`}
          className="lg:col-span-2"
        >
          <GrowthBars data={userActivity} />
        </ChartCard>

        <ChartCard title="Perfis da comunidade" subtitle={`${stats.users.total} pessoas na plataforma`}>
          <RoleDistribution data={roleData} />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Missões publicadas"
          subtitle="Distribuição dos últimos 7 dias"
          action={pluralize(missionsLast7Days, 'missão')}
        >
          <MissionBars data={missionActivity} />
        </ChartCard>

        <ChartCard
          title="Desempenho nos quizzes"
          subtitle="Qualidade das respostas registradas"
          action={`${(stats.quiz.accuracy * 100).toFixed(0)}% de acerto geral`}
          className="lg:col-span-2"
        >
          <QuizOverview
            attempts={quizLast30Days}
            correct={quizCorrectLast30Days}
            activeDays={activeQuizDays}
          />
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Turmas com mais alunos" subtitle="Matrículas ativas por turma">
          {tops.topClasses.length === 0 ? (
            <EmptyState message="Ainda não há turmas com matrículas." />
          ) : (
            <RankedList
              items={tops.topClasses.map((item) => ({
                label: item.name,
                meta: item.label,
                value: item.students,
                valueLabel: pluralize(item.students, 'aluno'),
              }))}
              color="#2563eb"
            />
          )}
        </ChartCard>

        <ChartCard title="Conquistas mais desbloqueadas" subtitle="Engajamento acumulado dos estudantes">
          {tops.topAchievements.length === 0 ? (
            <EmptyState message="Nenhuma conquista foi desbloqueada ainda." />
          ) : (
            <RankedList
              items={tops.topAchievements.map((item) => ({
                label: item.name,
                meta: item.category,
                value: item.unlocks,
                valueLabel: pluralize(item.unlocks, 'desbloqueio'),
              }))}
              color="#d97706"
            />
          )}
        </ChartCard>
      </section>
    </div>
  );
};

const ChartCard = ({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle: string;
  action?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <article className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      {action && (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {action}
        </span>
      )}
    </div>
    {children}
  </article>
);

const GrowthBars = ({ data }: { data: Array<{ dayLabel: string; users: number }> }) => {
  const maxValue = Math.max(...data.map((point) => point.users), 1);
  const peak = data.reduce((highest, point) => (point.users > highest.users ? point : highest), data[0]);

  return (
    <div className="space-y-4">
      <div className="flex h-40 items-end gap-1.5 sm:gap-2" aria-label="Cadastros por dia">
        {data.map((point, index) => {
          const height = point.users === 0 ? 5 : Math.max((point.users / maxValue) * 100, 18);
          const isPeak = point.users > 0 && point.users === peak.users;
          return (
            <div key={`${point.dayLabel}-${index}`} className="group flex h-full flex-1 flex-col justify-end">
              <div className="relative flex h-full items-end justify-center">
                {point.users > 0 && (
                  <span className="absolute -top-5 text-[11px] font-bold text-brand-900">{point.users}</span>
                )}
                <div
                  className={`w-full rounded-t-md transition-colors ${
                    point.users === 0 ? 'bg-slate-100' : isPeak ? 'bg-brand-900' : 'bg-blue-500'
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${point.dayLabel}: ${pluralize(point.users, 'cadastro')}`}
                />
              </div>
              <span className="mt-2 truncate text-center text-[10px] text-slate-400">
                {index === 0 || index === data.length - 1 || index % 3 === 0 ? point.dayLabel : ''}
              </span>
            </div>
          );
        })}
      </div>
      {peak?.users > 0 ? (
        <p className="text-xs text-slate-500">
          Maior movimento em <span className="font-semibold text-slate-700">{peak.dayLabel}</span>:{' '}
          {pluralize(peak.users, 'cadastro')}.
        </p>
      ) : (
        <EmptyState message="Nenhum cadastro nesse período." compact />
      )}
    </div>
  );
};

const RoleDistribution = ({
  data,
}: {
  data: Array<{ role: string; label: string; value: number; color: string }>;
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-5">
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" aria-label="Distribuição de usuários por perfil">
        {data.map((item) => (
          <div
            key={item.role}
            style={{ width: `${total === 0 ? 0 : (item.value / total) * 100}%`, backgroundColor: item.color }}
          />
        ))}
      </div>
      <div className="space-y-3">
        {data.map((item) => {
          const percentage = total === 0 ? 0 : Math.round((item.value / total) * 100);
          return (
            <div key={item.role} className="grid grid-cols-[auto,1fr,auto] items-center gap-3 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-xs font-semibold text-slate-500">
                {item.value} <span className="text-slate-400">({percentage}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MissionBars = ({ data }: { data: Array<{ dayLabel: string; missions: number }> }) => {
  const maxValue = Math.max(...data.map((point) => point.missions), 1);

  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((point) => {
        const height = point.missions === 0 ? 5 : Math.max((point.missions / maxValue) * 100, 16);
        return (
          <div key={point.dayLabel} className="flex h-full flex-1 flex-col justify-end text-center">
            <div className="relative flex h-full items-end justify-center">
              {point.missions > 0 && (
                <span className="absolute -top-5 text-xs font-bold text-amber-700">{point.missions}</span>
              )}
              <div
                className={point.missions === 0 ? 'w-full rounded-t-md bg-slate-100' : 'w-full rounded-t-md bg-amber-400'}
                style={{ height: `${height}%` }}
                title={`${point.dayLabel}: ${pluralize(point.missions, 'missão')}`}
              />
            </div>
            <span className="mt-2 text-[10px] text-slate-500">{point.dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
};

const QuizOverview = ({
  attempts,
  correct,
  activeDays,
}: {
  attempts: number;
  correct: number;
  activeDays: Array<{ dayLabel: string; correct: number; wrong: number; totalQuiz: number }>;
}) => {
  const wrong = attempts - correct;
  const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

  if (attempts === 0) {
    return <EmptyState message="Nenhuma resposta de quiz foi registrada nos últimos 30 dias." />;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[auto,1fr] sm:items-center">
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
          <div className="text-2xl font-bold text-emerald-700">{accuracy}%</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">acerto no período</div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">{pluralize(attempts, 'tentativa')}</span>
            <span className="text-slate-500">{correct} acertos · {wrong} erros</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-rose-100">
            <div className="bg-emerald-500" style={{ width: `${accuracy}%` }} />
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
        {activeDays.map((day) => (
          <div key={day.dayLabel} className="grid grid-cols-[58px,1fr,auto] items-center gap-3 px-3 py-2.5 text-xs">
            <span className="font-semibold text-slate-600">{day.dayLabel}</span>
            <div className="flex h-2 overflow-hidden rounded-full bg-rose-100">
              <div className="bg-emerald-500" style={{ width: `${(day.correct / day.totalQuiz) * 100}%` }} />
            </div>
            <span className="text-slate-500">{day.correct}/{day.wrong}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RankedList = ({
  items,
  color,
}: {
  items: Array<{ label: string; meta: string; value: number; valueLabel: string }>;
  color: string;
}) => {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={`${item.label}-${item.meta}`} className="grid grid-cols-[24px,1fr] gap-3">
          <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {index + 1}
          </span>
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <span className="block truncate font-semibold text-slate-700">{item.label}</span>
                <span className="text-xs text-slate-400">{item.meta}</span>
              </div>
              <span className="shrink-0 text-xs font-medium text-slate-500">{item.valueLabel}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: color }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};

const EmptyState = ({ message, compact = false }: { message: string; compact?: boolean }) => (
  <p className={`rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500 ${compact ? 'px-3 py-2' : 'px-4 py-10'}`}>
    {message}
  </p>
);
