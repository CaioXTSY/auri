import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Flag, Loader2, Trophy } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { MissionQuizModal } from '@/components/quiz/MissionQuizModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
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
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MissionStatus>('ALL');
  const [availablePage, setAvailablePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const pageSize = 6;
  const { notify } = useToast();

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
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  useEffect(() => {
    setAvailablePage(1);
    setHistoryPage(1);
  }, [searchTerm, typeFilter, statusFilter, tab]);

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

  const filteredAvailable = useMemo(() => {
    return available.filter((mission) => {
      const status = mission.userStatus?.status ?? 'NAO_INICIADA';
      const matchesStatus = statusFilter === 'ALL' || statusFilter === status;
      const matchesType = typeFilter === 'ALL' || mission.type === typeFilter;
      const matchesSearch =
        !normalizedSearch ||
        mission.title.toLowerCase().includes(normalizedSearch) ||
        mission.description.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [available, normalizedSearch, statusFilter, typeFilter]);

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      const matchesStatus = statusFilter === 'ALL' || statusFilter === entry.status;
      const matchesType = typeFilter === 'ALL' || entry.mission.type === typeFilter;
      const matchesSearch =
        !normalizedSearch ||
        entry.mission.title.toLowerCase().includes(normalizedSearch) ||
        entry.mission.description.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [history, normalizedSearch, statusFilter, typeFilter]);

  const availableEmpty = !isLoading && filteredAvailable.length === 0;
  const historyEmpty = !isLoading && filteredHistory.length === 0;

  const availableTotalPages = Math.max(1, Math.ceil(filteredAvailable.length / pageSize));
  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const availablePageSafe = Math.min(availablePage, availableTotalPages);
  const historyPageSafe = Math.min(historyPage, historyTotalPages);

  const paginatedAvailable = useMemo(() => {
    const start = (availablePageSafe - 1) * pageSize;
    return filteredAvailable.slice(start, start + pageSize);
  }, [availablePageSafe, filteredAvailable]);

  const paginatedHistory = useMemo(() => {
    const start = (historyPageSafe - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [historyPageSafe, filteredHistory]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <MissionQuizModal
          open={Boolean(activeMissionId)}
          missionId={activeMissionId}
          onClose={() => setActiveMissionId(null)}
          onAnswered={loadData}
        />
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

        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
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
              onChange={(event) => setTypeFilter(event.target.value as 'ALL' | 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 bg-white"
            >
              <option value="ALL">Todos os tipos</option>
              <option value="DIARIA">Diárias</option>
              <option value="SEMANAL">Semanais</option>
              <option value="PERSONALIZADA">Personalizadas</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'ALL' | MissionStatus)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 bg-white"
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
                <div key={`skeleton-${index}`} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
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
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Nenhuma missão encontrada para os filtros selecionados.'
              : 'Nenhuma missão disponível agora.'}
          </div>
        )}

        {!isLoading && tab === 'history' && historyEmpty && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Nenhuma missão encontrada para os filtros selecionados.'
              : 'Você ainda não iniciou nenhuma missão.'}
          </div>
        )}

        {!isLoading && tab === 'available' && (
          <div className="grid gap-6 md:grid-cols-2">
            {paginatedAvailable.map((mission) => {
              const status = mission.userStatus?.status ?? 'NAO_INICIADA';
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

                  <div className="flex flex-wrap gap-2">
                    {status === 'EM_PROGRESSO' && mission.type !== 'DIARIA' && (
                      <Button
                        type="button"
                        className="bg-brand-900 hover:bg-brand-800 text-white"
                        onClick={() => handleCompleteMission(mission.id)}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-slate-500">
            <span>
              Mostrando {(availablePageSafe - 1) * pageSize + 1} a {Math.min(availablePageSafe * pageSize, filteredAvailable.length)} de {filteredAvailable.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAvailablePage((page) => Math.max(1, page - 1))}
                disabled={availablePageSafe <= 1}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setAvailablePage((page) => Math.min(availableTotalPages, page + 1))}
                disabled={availablePageSafe >= availableTotalPages}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
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
              </div>
            ))}
          </div>
        )}

        {!isLoading && tab === 'history' && filteredHistory.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-slate-500">
            <span>
              Mostrando {(historyPageSafe - 1) * pageSize + 1} a {Math.min(historyPageSafe * pageSize, filteredHistory.length)} de {filteredHistory.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                disabled={historyPageSafe <= 1}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setHistoryPage((page) => Math.min(historyTotalPages, page + 1))}
                disabled={historyPageSafe >= historyTotalPages}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
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
