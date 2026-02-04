import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Flag, Loader2, Trophy } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { missionsService, type Mission, type MissionStatus, type MissionStats, type UserMission } from '@/services/missions-service';

type MissionsTab = 'available' | 'history';

const statusLabels: Record<MissionStatus, string> = {
  NAO_INICIADA: 'Não iniciada',
  EM_PROGRESSO: 'Em progresso',
  CONCLUIDA: 'Concluída',
  EXPIRADA: 'Expirada',
};

const typeLabels: Record<string, string> = {
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  PERSONALIZADA: 'Personalizada',
};

const getStatusStyle = (status: MissionStatus) => {
  if (status === 'CONCLUIDA') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'EM_PROGRESSO') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'EXPIRADA') return 'bg-slate-100 text-slate-500 border-slate-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

export const MissionsPage = () => {
  const [tab, setTab] = useState<MissionsTab>('available');
  const [available, setAvailable] = useState<Mission[]>([]);
  const [history, setHistory] = useState<UserMission[]>([]);
  const [stats, setStats] = useState<MissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [availableResponse, historyResponse, statsResponse] = await Promise.all([
        missionsService.getAvailable(),
        missionsService.getMyHistory(),
        missionsService.getMyStats(),
      ]);
      setAvailable(availableResponse);
      setHistory(historyResponse);
      setStats(statsResponse);
      const initialProgress: Record<string, number> = {};
      availableResponse.forEach((mission) => {
        if (mission.userStatus) {
          initialProgress[mission.id] = mission.userStatus.progress;
        }
      });
      setProgressMap(initialProgress);
    } catch (err) {
      setError('Não foi possível carregar as missões.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!isMounted) return;
      await loadData();
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const openDailyQuiz = () => {
    window.dispatchEvent(new Event('open-daily-quiz'));
  };

  const handleStartMission = async (missionId: string) => {
    try {
      await missionsService.startMission(missionId);
      await loadData();
    } catch (err) {
      setError('Não foi possível iniciar a missão.');
      console.error(err);
    }
  };

  const handleUpdateProgress = async (missionId: string) => {
    const progress = progressMap[missionId] ?? 0;
    try {
      await missionsService.updateProgress(missionId, progress);
      await loadData();
    } catch (err) {
      setError('Não foi possível atualizar o progresso.');
      console.error(err);
    }
  };

  const handleCompleteMission = async (missionId: string) => {
    try {
      await missionsService.completeMission(missionId);
      await loadData();
    } catch (err) {
      setError('Não foi possível concluir a missão.');
      console.error(err);
    }
  };

  const availableEmpty = !isLoading && available.length === 0;
  const historyEmpty = !isLoading && history.length === 0;

  const completionRate = useMemo(() => stats?.completionRate ?? 0, [stats]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-brand-900">Missões</h1>
            <p className="text-sm text-slate-500 mt-1">
              Acompanhe suas missões ativas e histórico de conquistas.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 text-slate-600"
            onClick={loadData}
          >
            Atualizar
          </Button>
        </div>

        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Total
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Concluídas
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                XP ganho
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">{stats.totalPoints}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Taxa de conclusão
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">{completionRate}%</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('available')}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.2em] border',
              tab === 'available'
                ? 'bg-brand-900 text-white border-brand-900'
                : 'bg-white text-slate-500 border-slate-200',
            )}
          >
            Disponíveis
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.2em] border',
              tab === 'history'
                ? 'bg-brand-900 text-white border-brand-900'
                : 'bg-white text-slate-500 border-slate-200',
            )}
          >
            Histórico
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando missões...
          </div>
        )}

        {error && <div className="text-sm text-red-500">{error}</div>}

        {!isLoading && tab === 'available' && availableEmpty && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Nenhuma missão disponível agora.
          </div>
        )}

        {!isLoading && tab === 'history' && historyEmpty && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Você ainda não iniciou nenhuma missão.
          </div>
        )}

        {!isLoading && tab === 'available' && (
          <div className="grid gap-6 md:grid-cols-2">
            {available.map((mission) => {
              const status = mission.userStatus?.status ?? 'NAO_INICIADA';
              const progress = mission.userStatus?.progress ?? 0;
              const isDaily = mission.type === 'DIARIA';
              return (
                <div
                  key={mission.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">{mission.title}</h3>
                      <p className="text-sm text-slate-500">{mission.description}</p>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border',
                        getStatusStyle(status),
                      )}
                    >
                      {statusLabels[status]}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {typeLabels[mission.type] || mission.type}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" />
                      {mission.points} XP
                    </span>
                    {mission.class && (
                      <span className="inline-flex items-center gap-1">
                        <Flag className="h-3.5 w-3.5" />
                        {mission.class.name}
                      </span>
                    )}
                  </div>

                  {status === 'EM_PROGRESSO' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Progresso</span>
                        <span>{progressMap[mission.id] ?? progress}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={progressMap[mission.id] ?? progress}
                        onChange={(event) =>
                          setProgressMap((prev) => ({
                            ...prev,
                            [mission.id]: Number(event.target.value),
                          }))
                        }
                        className="w-full accent-brand-900"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {status === 'NAO_INICIADA' && (
                      <Button
                        type="button"
                        className="bg-brand-900 hover:bg-brand-800 text-white"
                        onClick={() => handleStartMission(mission.id)}
                      >
                        Iniciar missão
                      </Button>
                    )}
                    {status === 'EM_PROGRESSO' && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-slate-200 text-slate-600"
                          onClick={() => handleUpdateProgress(mission.id)}
                        >
                          Atualizar progresso
                        </Button>
                        <Button
                          type="button"
                          className="bg-brand-900 hover:bg-brand-800 text-white"
                          onClick={() => handleCompleteMission(mission.id)}
                        >
                          Concluir
                        </Button>
                      </>
                    )}
                    {isDaily && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200 text-slate-600"
                        onClick={openDailyQuiz}
                      >
                        Abrir quiz diário
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && tab === 'history' && (
          <div className="grid gap-6 md:grid-cols-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{entry.mission.title}</h3>
                    <p className="text-sm text-slate-500">{entry.mission.description}</p>
                  </div>
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border',
                      getStatusStyle(entry.status),
                    )}
                  >
                    {statusLabels[entry.status]}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {typeLabels[entry.mission.type] || entry.mission.type}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" />
                    {entry.mission.points} XP
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Progresso</span>
                  <span>{entry.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      entry.status === 'CONCLUIDA'
                        ? 'bg-emerald-500'
                        : entry.status === 'EM_PROGRESSO'
                        ? 'bg-brand-600'
                        : 'bg-slate-300',
                    )}
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
