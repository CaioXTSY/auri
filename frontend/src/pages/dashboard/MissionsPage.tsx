import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Flag, Loader2, Trophy } from 'lucide-react';
import { MISSIONS_PAGE_SIZE } from '@/constants/app';
import { checkAchievementUnlocks } from '@/components/gamification/achievement-unlock-events';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MissionQuizModal } from '@/components/quiz/MissionQuizModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  missionsService,
  type Mission,
  type MissionStats,
  type MissionStatus,
  type UserMission,
} from '@/services/missions-service';

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
  if (status === 'CONCLUIDA') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'EM_PROGRESSO') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'EXPIRADA') return 'border-slate-200 bg-slate-100 text-slate-500';
  return 'border-amber-200 bg-amber-50 text-amber-700';
};

export const MissionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as MissionsTab) ?? 'available';
  const searchTerm = searchParams.get('search') ?? '';
  const typeFilter =
    (searchParams.get('type') as 'ALL' | 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA') ?? 'ALL';
  const statusFilter = (searchParams.get('status') as 'ALL' | MissionStatus) ?? 'ALL';

  const [available, setAvailable] = useState<Mission[]>([]);
  const [history, setHistory] = useState<UserMission[]>([]);
  const [stats, setStats] = useState<MissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [availablePage, setAvailablePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const { notify } = useToast();
  const pageSize = MISSIONS_PAGE_SIZE;

  const setTab = (value: MissionsTab) =>
    setSearchParams((prev) => {
      prev.set('tab', value);
      return prev;
    }, { replace: true });

  const setSearchTerm = (value: string) =>
    setSearchParams((prev) => {
      if (value) {
        prev.set('search', value);
      } else {
        prev.delete('search');
      }
      return prev;
    }, { replace: true });

  const setTypeFilter = (value: 'ALL' | 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA') =>
    setSearchParams((prev) => {
      if (value !== 'ALL') {
        prev.set('type', value);
      } else {
        prev.delete('type');
      }
      return prev;
    }, { replace: true });

  const setStatusFilter = (value: 'ALL' | MissionStatus) =>
    setSearchParams((prev) => {
      if (value !== 'ALL') {
        prev.set('status', value);
      } else {
        prev.delete('status');
      }
      return prev;
    }, { replace: true });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [availableResponse, historyResponse, statsResponse] = await Promise.all([
        missionsService.getAvailable(),
        missionsService.getMyHistory(),
        missionsService.getMyStats(),
      ]);

      setAvailable(availableResponse);
      setHistory(historyResponse.data);
      setStats(statsResponse);
    } catch {
      setError('Não foi possível carregar as missões.');
      notify({ title: 'Falha ao carregar missões', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isMounted) return;
      await loadData();
      checkAchievementUnlocks();
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [loadData]);

  useEffect(() => {
    setAvailablePage(1);
    setHistoryPage(1);
  }, [searchTerm, statusFilter, tab, typeFilter]);

  const openMissionQuiz = (missionId: string) => {
    setActiveMissionId(missionId);
  };

  const handleCompleteMission = async (missionId: string) => {
    try {
      await missionsService.completeMission(missionId);
      await loadData();
      notify({ title: 'Missão concluída', variant: 'success' });
    } catch {
      setError('Não foi possível concluir a missão.');
      notify({ title: 'Falha ao concluir missão', variant: 'error' });
    }
  };

  const completionRate = useMemo(() => stats?.completionRate ?? 0, [stats]);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredAvailable = useMemo(
    () =>
      available.filter((mission) => {
        const status = mission.userStatus?.status ?? 'NAO_INICIADA';
        const matchesStatus = statusFilter === 'ALL' || statusFilter === status;
        const matchesType = typeFilter === 'ALL' || mission.type === typeFilter;
        const matchesSearch =
          !normalizedSearch ||
          mission.title.toLowerCase().includes(normalizedSearch) ||
          mission.description.toLowerCase().includes(normalizedSearch);

        return matchesStatus && matchesType && matchesSearch;
      }),
    [available, normalizedSearch, statusFilter, typeFilter],
  );

  const filteredHistory = useMemo(
    () =>
      history.filter((entry) => {
        const matchesStatus = statusFilter === 'ALL' || statusFilter === entry.status;
        const matchesType = typeFilter === 'ALL' || entry.mission.type === typeFilter;
        const matchesSearch =
          !normalizedSearch ||
          entry.mission.title.toLowerCase().includes(normalizedSearch) ||
          entry.mission.description.toLowerCase().includes(normalizedSearch);

        return matchesStatus && matchesType && matchesSearch;
      }),
    [history, normalizedSearch, statusFilter, typeFilter],
  );

  const availableEmpty = !isLoading && filteredAvailable.length === 0;
  const historyEmpty = !isLoading && filteredHistory.length === 0;
  const availableTotalPages = Math.max(1, Math.ceil(filteredAvailable.length / pageSize));
  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const availablePageSafe = Math.min(availablePage, availableTotalPages);
  const historyPageSafe = Math.min(historyPage, historyTotalPages);

  const paginatedAvailable = useMemo(() => {
    const start = (availablePageSafe - 1) * pageSize;
    return filteredAvailable.slice(start, start + pageSize);
  }, [availablePageSafe, filteredAvailable, pageSize]);

  const paginatedHistory = useMemo(() => {
    const start = (historyPageSafe - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, historyPageSafe, pageSize]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <MissionQuizModal
          open={Boolean(activeMissionId)}
          missionId={activeMissionId}
          onClose={() => setActiveMissionId(null)}
          onAnswered={loadData}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1
              className="font-display text-2xl font-bold text-brand-900"
              data-tour="missions-header"
            >
              Missões
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Acompanhe suas missões ativas e o histórico de conquistas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 text-slate-600"
              onClick={loadData}
            >
              Atualizar
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Total
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Concluídas
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.completed}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                XP ganho
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">{stats.totalPoints}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Taxa de conclusão
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-900">{completionRate}%</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2" data-tour="missions-tabs">
          <button
            type="button"
            onClick={() => setTab('available')}
            className={cn(
              'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]',
              tab === 'available'
                ? 'border-brand-900 bg-brand-900 text-white'
                : 'border-slate-200 bg-white text-slate-500',
            )}
          >
            Disponíveis
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={cn(
              'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]',
              tab === 'history'
                ? 'border-brand-900 bg-brand-900 text-white'
                : 'border-slate-200 bg-white text-slate-500',
            )}
          >
            Histórico
          </button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center" data-tour="missions-filters">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por título ou descrição"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as 'ALL' | 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA')
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            >
              <option value="ALL">Todos os tipos</option>
              <option value="DIARIA">Diárias</option>
              <option value="SEMANAL">Semanais</option>
              <option value="PERSONALIZADA">Personalizadas</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'ALL' | MissionStatus)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            >
              <option value="ALL">Todos os status</option>
              <option value="NAO_INICIADA">Não iniciada</option>
              <option value="EM_PROGRESSO">Em progresso</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="EXPIRADA">Expirada</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando missões...
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-28 rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="text-sm text-red-500">{error}</div>}

        {!isLoading && tab === 'available' && availableEmpty && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Nenhuma missão encontrada para os filtros selecionados.'
              : 'Nenhuma missão disponível agora.'}
          </div>
        )}

        {!isLoading && tab === 'history' && historyEmpty && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Nenhuma missão encontrada para os filtros selecionados.'
              : 'Você ainda não iniciou nenhuma missão.'}
          </div>
        )}

        {!isLoading && tab === 'available' && (
          <div className="grid gap-6 md:grid-cols-2">
            {paginatedAvailable.map((mission, index) => {
              const status = mission.userStatus?.status ?? 'NAO_INICIADA';
              const showActionTour =
                index === 0 && (mission.type === 'DIARIA' || status === 'EM_PROGRESSO');

              return (
                <div
                  key={mission.id}
                  className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  data-tour={index === 0 ? 'mission-card' : undefined}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">{mission.title}</h3>
                      <p className="text-sm text-slate-500">{mission.description}</p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
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

                  <div className="flex flex-wrap gap-2">
                    {status === 'EM_PROGRESSO' && mission.type !== 'DIARIA' && (
                      <Button
                        type="button"
                        className="bg-brand-900 text-white hover:bg-brand-800"
                        onClick={() => handleCompleteMission(mission.id)}
                        data-tour={showActionTour ? 'mission-action' : undefined}
                      >
                        Concluir
                      </Button>
                    )}
                    {mission.type === 'DIARIA' && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200 text-slate-600"
                        onClick={() => openMissionQuiz(mission.id)}
                        data-tour={showActionTour ? 'mission-action' : undefined}
                      >
                        Abrir quiz
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && tab === 'available' && filteredAvailable.length > 0 && (
          <div className="flex flex-col justify-between gap-3 text-sm text-slate-500 sm:flex-row sm:items-center">
            <span>
              Mostrando {(availablePageSafe - 1) * pageSize + 1} a{' '}
              {Math.min(availablePageSafe * pageSize, filteredAvailable.length)} de{' '}
              {filteredAvailable.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAvailablePage((page) => Math.max(1, page - 1))}
                disabled={availablePageSafe <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setAvailablePage((page) => Math.min(availableTotalPages, page + 1))}
                disabled={availablePageSafe >= availableTotalPages}
                className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}

        {!isLoading && tab === 'history' && (
          <div className="grid gap-6 md:grid-cols-2">
            {paginatedHistory.map((entry) => (
              <div
                key={entry.id}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{entry.mission.title}</h3>
                    <p className="text-sm text-slate-500">{entry.mission.description}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
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
              </div>
            ))}
          </div>
        )}

        {!isLoading && tab === 'history' && filteredHistory.length > 0 && (
          <div className="flex flex-col justify-between gap-3 text-sm text-slate-500 sm:flex-row sm:items-center">
            <span>
              Mostrando {(historyPageSafe - 1) * pageSize + 1} a{' '}
              {Math.min(historyPageSafe * pageSize, filteredHistory.length)} de{' '}
              {filteredHistory.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                disabled={historyPageSafe <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setHistoryPage((page) => Math.min(historyTotalPages, page + 1))}
                disabled={historyPageSafe >= historyTotalPages}
                className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
