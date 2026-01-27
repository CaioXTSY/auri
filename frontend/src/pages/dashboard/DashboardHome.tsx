import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/stores/auth-store';

interface Activity {
  id: string;
  title: string;
  discipline: string;
  dueDate: string;
  status: 'pendente' | 'em_andamento';
}

export const DashboardHome = () => {
  const user = useAuthStore((state) => state.user);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Aluno';

  const level = 3;
  const currentXp = 1250;
  const nextLevelXp = 1500;

  const progress = useMemo(() => {
    if (!nextLevelXp) return 0;
    const ratio = currentXp / nextLevelXp;
    if (!Number.isFinite(ratio)) return 0;
    return Math.min(100, Math.max(0, Math.round(ratio * 100)));
  }, [currentXp, nextLevelXp]);

  const upcomingActivities: Activity[] = [
    {
      id: '1',
      title: 'Lista 2: Estruturas de Repetição',
      discipline: 'Algoritmos I',
      dueDate: 'Hoje • 23:59',
      status: 'em_andamento',
    },
    {
      id: '2',
      title: 'Projeto: Jogo de Adivinhação',
      discipline: 'Lógica de Programação',
      dueDate: 'Em 2 dias',
      status: 'pendente',
    },
    {
      id: '3',
      title: 'Quiz: Conceitos de Variáveis',
      discipline: 'Introdução à Programação',
      dueDate: 'Em 5 dias',
      status: 'pendente',
    },
  ];

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
                Continue evoluindo sua trilha. Complete atividades, acumule pontos e avance de nível
                na AURI.
              </p>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em]">
                  Nível Atual
                </p>
                <p className="mt-1 text-4xl font-display font-bold text-accent-600">Nível {level}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {currentXp} XP de {nextLevelXp} XP para o próximo nível
                </p>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-[0.16em]">
                    Progresso
                  </span>
                  <span className="text-xs font-semibold text-brand-900">{progress}%</span>
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
              Complete 3 atividades e conquiste um novo emblema.
            </h2>
            <p className="mt-2 text-sm text-brand-100">
              Foque em entregar as próximas atividades antes do prazo para manter sua streak ativa.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="flex-1 h-1.5 bg-brand-800 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-accent-500 rounded-full" />
              </div>
              <span className="font-semibold text-accent-200">2 de 3 concluídas</span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.18em]">
                Próximas Atividades
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Atividades organizadas por proximidade de entrega.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {upcomingActivities.map((activity) => (
              <div
                key={activity.id}
                className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">
                    {activity.title}
                  </span>
                  <span className="text-xs text-slate-500">{activity.discipline}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-[0.16em]">
                      Prazo
                    </p>
                    <p className="text-xs text-slate-800">{activity.dueDate}</p>
                  </div>
                  <span
                    className={
                      activity.status === 'em_andamento'
                        ? 'inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100'
                        : 'inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-100'
                    }
                  >
                    {activity.status === 'em_andamento' ? 'Em andamento' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

