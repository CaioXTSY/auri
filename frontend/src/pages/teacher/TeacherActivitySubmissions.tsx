import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Code2, Loader2, RefreshCw } from 'lucide-react';
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
import {
  programmingService,
  type CodeSubmission,
  type CodeSubmissionStatus,
  type ProgrammingAssignment,
} from '@/services/programming-service';

const statusOptions: Array<CodeSubmissionStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'RUNNING',
  'ACCEPTED',
  'WRONG_ANSWER',
  'RUNTIME_ERROR',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'INTERNAL_ERROR',
];

interface StudentSummary {
  userId: string;
  name: string;
  email: string;
  attempts: number;
  bestScore: number;
  lastSubmission: CodeSubmission;
  accepted: boolean;
}

const formatDateTime = (date?: string | null) =>
  date ? new Date(date).toLocaleString('pt-BR') : '-';

export const TeacherActivitySubmissions = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<ProgrammingAssignment | null>(null);
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState<CodeSubmissionStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [assignmentData, submissionData] = await Promise.all([
        programmingService.getAssignment(id),
        programmingService.getAssignmentSubmissions(id),
      ]);
      setAssignment(assignmentData);
      setSubmissions(submissionData);
    } catch (err) {
      setError('Nao foi possivel carregar as submissoes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSubmissions = useMemo(
    () =>
      statusFilter === 'ALL'
        ? submissions
        : submissions.filter((submission) => submission.status === statusFilter),
    [statusFilter, submissions],
  );

  const studentSummaries = useMemo(() => {
    const byUser = new Map<string, StudentSummary>();

    for (const submission of submissions) {
      if (!submission.user) continue;
      const current = byUser.get(submission.user.id);
      const isOfficial = submission.mode === 'SUBMIT';
      const bestScore = isOfficial
        ? Math.max(current?.bestScore ?? 0, submission.score)
        : current?.bestScore ?? 0;
      const attempts = (current?.attempts ?? 0) + (isOfficial ? 1 : 0);
      const lastSubmission =
        !current || new Date(submission.createdAt) > new Date(current.lastSubmission.createdAt)
          ? submission
          : current.lastSubmission;

      byUser.set(submission.user.id, {
        userId: submission.user.id,
        name: submission.user.name,
        email: submission.user.email,
        attempts,
        bestScore,
        lastSubmission,
        accepted: (current?.accepted ?? false) || submission.status === 'ACCEPTED',
      });
    }

    return Array.from(byUser.values()).sort((a, b) => b.bestScore - a.bestScore);
  }, [submissions]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button
              type="button"
              variant="ghost"
              className="mb-2 px-0 text-slate-600"
              onClick={() => navigate('/dashboard/teacher/activities')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="font-display text-2xl font-bold text-brand-900">
              Submissoes da atividade
            </h1>
            <p className="text-sm text-slate-500">
              {assignment ? `${assignment.title} - ${assignment.class?.name}` : 'Historico da turma'}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

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
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Alunos com envio" value={studentSummaries.length} />
              <Metric label="Submissoes" value={submissions.length} />
              <Metric
                label="Aceitos"
                value={submissions.filter((submission) => submission.status === 'ACCEPTED').length}
              />
              <Metric
                label="Maior score"
                value={`${Math.max(0, ...studentSummaries.map((item) => item.bestScore))}`}
              />
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-brand-700" />
                <h2 className="text-lg font-semibold text-brand-900">Resumo por aluno</h2>
              </div>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Aluno</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Melhor score</TableHeaderCell>
                      <TableHeaderCell>Tentativas</TableHeaderCell>
                      <TableHeaderCell>Ultima submissao</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {studentSummaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500">
                          Nenhum aluno enviou codigo ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentSummaries.map((student) => (
                        <TableRow key={student.userId}>
                          <TableCell>
                            <div className="font-medium text-slate-900">{student.name}</div>
                            <div className="text-xs text-slate-500">{student.email}</div>
                          </TableCell>
                          <TableCell>
                            <StatusPill status={student.lastSubmission.status} />
                          </TableCell>
                          <TableCell className="text-slate-700">{student.bestScore}</TableCell>
                          <TableCell className="text-slate-700">{student.attempts}</TableCell>
                          <TableCell className="text-slate-700">
                            {formatDateTime(student.lastSubmission.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </Table>
              </TableContainer>
            </section>

            <section className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-brand-900">Historico de envios</h2>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as CodeSubmissionStatus | 'ALL')
                  }
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === 'ALL' ? 'Todos os status' : status}
                    </option>
                  ))}
                </select>
              </div>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Aluno</TableHeaderCell>
                      <TableHeaderCell>Linguagem</TableHeaderCell>
                      <TableHeaderCell>Modo</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Score</TableHeaderCell>
                      <TableHeaderCell>Criada em</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    {filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500">
                          Nenhuma submissao encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <div className="font-medium text-slate-900">
                              {submission.user?.name ?? 'Aluno'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {submission.user?.email ?? submission.userId}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-700">{submission.language}</TableCell>
                          <TableCell className="text-slate-700">{submission.mode}</TableCell>
                          <TableCell>
                            <StatusPill status={submission.status} />
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {submission.score} ({submission.passedTests}/{submission.totalTests})
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {formatDateTime(submission.createdAt)}
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

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-brand-900">{value}</p>
  </div>
);

const StatusPill = ({ status }: { status: CodeSubmissionStatus }) => {
  const className =
    status === 'ACCEPTED'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'PENDING' || status === 'RUNNING'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{status}</span>;
};
