import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Play, Trophy } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  programmingService,
  type CodeSubmissionStatus,
  type ProgrammingAssignment,
} from '@/services/programming-service';

const statusLabel: Record<CodeSubmissionStatus, string> = {
  PENDING: 'Na fila',
  RUNNING: 'Executando',
  ACCEPTED: 'Aceita',
  WRONG_ANSWER: 'Resposta errada',
  RUNTIME_ERROR: 'Erro de execucao',
  TIME_LIMIT_EXCEEDED: 'Tempo excedido',
  MEMORY_LIMIT_EXCEEDED: 'Memoria excedida',
  INTERNAL_ERROR: 'Falha interna',
};

const statusStyle = (status?: CodeSubmissionStatus) => {
  if (!status) return 'border-slate-200 bg-slate-50 text-slate-500';
  if (status === 'ACCEPTED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'PENDING' || status === 'RUNNING') return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
};

const difficultyLabel: Record<string, string> = {
  FACIL: 'Facil',
  MEDIO: 'Medio',
  DIFICIL: 'Dificil',
};

export const ActivitiesPage = () => {
  const [assignments, setAssignments] = useState<ProgrammingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { notify } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAssignments(await programmingService.getMyAssignments());
    } catch {
      setError('Nao foi possivel carregar as atividades de codigo.');
      notify({ title: 'Falha ao carregar atividades', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return assignments;

    return assignments.filter((assignment) =>
      [
        assignment.title,
        assignment.problem.title,
        assignment.problem.statement,
        assignment.class.name,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [assignments, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-900">
              Atividades de codigo
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Resolva problemas de programacao das suas turmas.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadData}>
            Atualizar
          </Button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por problema, turma ou enunciado"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />

        {isLoading && (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <Skeleton className="mt-5 h-10 w-32" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <ErrorState
            message={error}
            action={
              <Button type="button" size="sm" variant="outline" onClick={loadData}>
                Tentar de novo
              </Button>
            }
          />
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <EmptyState message="Nenhuma atividade de codigo encontrada." />
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((assignment) => {
              const lastSubmission = assignment.submissions?.[0];
              const dueDate = assignment.dueDate
                ? new Date(assignment.dueDate).toLocaleDateString('pt-BR')
                : 'Sem prazo';

              return (
                <article
                  key={assignment.id}
                  className="flex flex-col justify-between gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {assignment.class.name}
                        </p>
                        <h2 className="mt-1 text-lg font-bold text-slate-950">
                          {assignment.title}
                        </h2>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold',
                          statusStyle(lastSubmission?.status),
                        )}
                      >
                        {lastSubmission ? statusLabel[lastSubmission.status] : 'Nao enviada'}
                      </span>
                    </div>

                    <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                      {assignment.problem.statement}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                        <Code2 className="h-3.5 w-3.5" />
                        {assignment.problem.allowedLanguages.join(' / ')}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                        <Trophy className="h-3.5 w-3.5" />
                        {assignment.points} pts
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        {difficultyLabel[assignment.problem.difficulty]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        Prazo: {dueDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      {lastSubmission
                        ? `${lastSubmission.score} pts - ${lastSubmission.passedTests}/${lastSubmission.totalTests} testes`
                        : 'Comece pelo editor e execute os exemplos.'}
                    </div>
                    <Button asChild className="bg-brand-900 text-white hover:bg-brand-800">
                      <Link to={`/dashboard/activities/${assignment.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Resolver
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
