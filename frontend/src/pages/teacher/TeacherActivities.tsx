import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Code2,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Plus,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table';
import { classService, type Class } from '@/services/class-service';
import {
  programmingService,
  type ProgrammingAssignment,
  type ProgrammingProblem,
  type RunnerStats,
} from '@/services/programming-service';
import { useAuthStore } from '@/stores/auth-store';

const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString('pt-BR') : 'Sem prazo';

export const TeacherActivities = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const user = useAuthStore((state) => state.user);
  const [problems, setProblems] = useState<ProgrammingProblem[]>([]);
  const [assignments, setAssignments] = useState<ProgrammingAssignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [runnerStats, setRunnerStats] = useState<RunnerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [problemData, assignmentData, classData, statsData] = await Promise.all([
        programmingService.getProblems(1, 100),
        programmingService.getAssignments(1, 100),
        classService.getAllClasses(),
        user?.role === 'ADMIN'
          ? programmingService.getRunnerStats().catch(() => null)
          : Promise.resolve(null),
      ]);
      setProblems(problemData.data);
      setAssignments(assignmentData.data);
      setClasses(classData);
      setRunnerStats(statsData);
    } catch (err) {
      setError('Nao foi possivel carregar atividades de codigo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleAssignmentPublished = async (assignment: ProgrammingAssignment) => {
    setError(null);
    try {
      const updated = await programmingService.updateAssignment(assignment.id, {
        published: !assignment.published,
      });

      setAssignments((current) =>
        current.map((item) => (item.id === assignment.id ? { ...item, ...updated } : item)),
      );
    } catch (err) {
      setError('Nao foi possivel alterar a publicacao da atividade.');
      console.error(err);
    }
  };

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === classId),
    [classId, classes],
  );

  const visibleAssignments = useMemo(
    () =>
      classId
        ? assignments.filter((assignment) => assignment.class?.id === classId)
        : assignments,
    [assignments, classId],
  );

  const newActivityPath = classId
    ? `/dashboard/teacher/activities/new?classId=${classId}`
    : '/dashboard/teacher/activities/new';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-900">
              Atividades de codigo
            </h1>
            <p className="text-sm text-slate-500">
              {selectedClass
                ? `Problemas publicados para ${selectedClass.name}.`
                : 'Crie problemas, publique para turmas e acompanhe entregas.'}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => navigate(newActivityPath)}
            className="bg-accent-600 font-bold text-brand-950 hover:bg-accent-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova atividade
          </Button>
        </div>

        {user?.role === 'ADMIN' && runnerStats ? <RunnerStatsPanel stats={runnerStats} /> : null}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-brand-700" />
                <h2 className="text-lg font-semibold text-brand-900">Banco de problemas</h2>
              </div>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Titulo</TableHeaderCell>
                      <TableHeaderCell>Dificuldade</TableHeaderCell>
                      <TableHeaderCell>Testes</TableHeaderCell>
                      <TableHeaderCell>Publicacoes</TableHeaderCell>
                      <TableHeaderCell className="text-right">Acoes</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {problems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500">
                          Nenhum problema cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      problems.map((problem) => (
                        <TableRow key={problem.id}>
                          <TableCell>
                            <div className="font-medium text-slate-900">{problem.title}</div>
                            <div className="text-xs text-slate-500">
                              {problem.allowedLanguages.join(', ')}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">{problem.difficulty}</TableCell>
                          <TableCell className="text-slate-600">
                            {problem._count?.testCases ?? problem.testCases?.length ?? 0}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {problem._count?.assignments ?? problem.assignments?.length ?? 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/dashboard/teacher/activities/${problem.id}/edit?type=problem`,
                                )
                              }
                            >
                              <Edit3 className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </Table>
              </TableContainer>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-700" />
                <h2 className="text-lg font-semibold text-brand-900">Atividades publicadas</h2>
              </div>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Atividade</TableHeaderCell>
                      <TableHeaderCell>Turma</TableHeaderCell>
                      <TableHeaderCell>Prazo</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell className="text-right">Acoes</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {visibleAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500">
                          Nenhuma atividade publicada neste filtro.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div className="font-medium text-slate-900">{assignment.title}</div>
                            <div className="text-xs text-slate-500">
                              {assignment.problem?.title}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {assignment.class?.name ?? '-'}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {formatDate(assignment.dueDate)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                assignment.published
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {assignment.published ? 'Publicada' : 'Rascunho'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(`/dashboard/teacher/activities/${assignment.id}/edit`)
                                }
                              >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAssignmentPublished(assignment)}
                              >
                                <EyeOff className="mr-2 h-4 w-4" />
                                {assignment.published ? 'Despublicar' : 'Publicar'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `/dashboard/teacher/activities/${assignment.id}/submissions`,
                                  )
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Submissoes
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </Table>
              </TableContainer>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const RunnerStatsPanel = ({ stats }: { stats: RunnerStats }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex items-center gap-2">
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <h2 className="font-semibold text-brand-900">Operacao do judge</h2>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Metric label="Pendentes" value={stats.pending} />
      <Metric label="Rodando" value={stats.running} />
      <Metric label="Travadas" value={stats.stuckRunning} tone={stats.stuckRunning ? 'warn' : 'ok'} />
      <Metric label="Media runtime" value={`${stats.averageRuntimeMs} ms`} />
      <Metric
        label="JS / Python"
        value={`${stats.totalsByLanguage.JAVASCRIPT ?? 0} / ${
          stats.totalsByLanguage.PYTHON ?? 0
        }`}
      />
    </div>
    {stats.recentInternalErrors.length > 0 ? (
      <div className="mt-4 rounded-md border border-red-100 bg-red-50 p-3">
        <p className="text-sm font-semibold text-red-700">Erros internos recentes</p>
        <ul className="mt-2 space-y-1 text-xs text-red-700">
          {stats.recentInternalErrors.map((error) => (
            <li key={error.id} className="truncate">
              {error.id} - {error.language} - {error.errorMessage || 'sem mensagem'}
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </section>
);

const Metric = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'warn' | 'ok';
}) => (
  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
    <p
      className={`mt-1 text-xl font-bold ${
        tone === 'warn' ? 'text-red-700' : tone === 'ok' ? 'text-emerald-700' : 'text-brand-900'
      }`}
    >
      {value}
    </p>
  </div>
);
