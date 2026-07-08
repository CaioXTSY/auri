import Editor from '@monaco-editor/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  Send,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  programmingService,
  type CodeSubmission,
  type CodeSubmissionStatus,
  type ProgrammingAssignmentSolve,
  type ProgrammingLanguage,
} from '@/services/programming-service';

type MobileTab = 'statement' | 'code' | 'result' | 'history';

const statusLabel: Record<CodeSubmissionStatus, string> = {
  PENDING: 'Na fila',
  RUNNING: 'Executando',
  ACCEPTED: 'Aceito',
  WRONG_ANSWER: 'Resposta errada',
  RUNTIME_ERROR: 'Erro de execucao',
  TIME_LIMIT_EXCEEDED: 'Tempo excedido',
  MEMORY_LIMIT_EXCEEDED: 'Memoria excedida',
  INTERNAL_ERROR: 'Falha interna',
};

const finalStatuses: CodeSubmissionStatus[] = [
  'ACCEPTED',
  'WRONG_ANSWER',
  'RUNTIME_ERROR',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'INTERNAL_ERROR',
];

const monacoLanguage: Record<ProgrammingLanguage, string> = {
  JAVASCRIPT: 'javascript',
  PYTHON: 'python',
};

const statusClass = (status?: CodeSubmissionStatus) => {
  if (status === 'ACCEPTED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'PENDING' || status === 'RUNNING') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (!status) return 'border-slate-200 bg-slate-50 text-slate-500';
  return 'border-red-200 bg-red-50 text-red-700';
};

const getDefaultCode = (
  assignment: ProgrammingAssignmentSolve,
  language: ProgrammingLanguage,
) => assignment.problem.starterCode?.[language] ?? '';

export const ActivitySolvePage = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<ProgrammingAssignmentSolve | null>(null);
  const [language, setLanguage] = useState<ProgrammingLanguage>('JAVASCRIPT');
  const [code, setCode] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('statement');
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<CodeSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const [assignmentResponse, submissionsResponse] = await Promise.all([
        programmingService.getSolveAssignment(id),
        programmingService.getMySubmissions(id),
      ]);
      const firstLanguage = assignmentResponse.problem.allowedLanguages[0] ?? 'JAVASCRIPT';

      setAssignment(assignmentResponse);
      setLanguage(firstLanguage);
      setCode(getDefaultCode(assignmentResponse, firstLanguage));
      setSubmissions(submissionsResponse);
      setActiveSubmission(submissionsResponse[0] ?? null);
      setIsDirty(false);
    } catch {
      setError('Nao foi possivel carregar a atividade.');
      notify({ title: 'Falha ao carregar atividade', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [id, notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pollSubmission = useCallback(
    async (submissionId: string) => {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const submission = await programmingService.getSubmission(submissionId);
        setActiveSubmission(submission);
        setSubmissions((current) => {
          const exists = current.some((item) => item.id === submission.id);
          return exists
            ? current.map((item) => (item.id === submission.id ? submission : item))
            : [submission, ...current];
        });

        if (finalStatuses.includes(submission.status)) {
          return submission;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      return null;
    },
    [],
  );

  const handleLanguageChange = (nextLanguage: ProgrammingLanguage) => {
    if (!assignment || nextLanguage === language) return;
    if (isDirty && !window.confirm('Trocar a linguagem vai substituir o codigo atual.')) {
      return;
    }

    setLanguage(nextLanguage);
    setCode(getDefaultCode(assignment, nextLanguage));
    setIsDirty(false);
  };

  const execute = async (mode: 'run' | 'submit') => {
    if (!id || !assignment) return;

    const setBusy = mode === 'run' ? setIsRunning : setIsSubmitting;
    setBusy(true);
    setActiveTab('result');

    try {
      const created =
        mode === 'run'
          ? await programmingService.runAssignment(id, { language, code })
          : await programmingService.submitAssignment(id, { language, code });

      setActiveSubmission(created);
      const judged = await pollSubmission(created.id);

      if (!judged) {
        notify({
          title: 'Submissao ainda em processamento',
          description: 'O resultado sera atualizado no historico em instantes.',
          variant: 'default',
        });
        return;
      }

      notify({
        title: mode === 'run' ? 'Execucao finalizada' : 'Submissao julgada',
        description: `${statusLabel[judged.status]} - ${judged.passedTests}/${judged.totalTests} testes`,
        variant: judged.status === 'ACCEPTED' ? 'success' : 'default',
      });
    } catch {
      notify({
        title: mode === 'run' ? 'Falha ao executar' : 'Falha ao enviar',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const dueDate = useMemo(() => {
    if (!assignment?.dueDate) return 'Sem prazo';
    return new Date(assignment.dueDate).toLocaleString('pt-BR');
  }, [assignment]);

  const statementPanel = assignment && (
    <div className="space-y-5">
      <div>
        <Link
          to="/dashboard/activities"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Atividades
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold text-brand-900">
          {assignment.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {assignment.class.name} - {assignment.points} pts - Prazo: {dueDate}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            {assignment.problem.difficulty}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            {assignment.problem.timeLimitMs}ms
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            {assignment.problem.memoryLimitMb}MB
          </span>
        </div>
        <MarkdownContent
          content={assignment.problem.statement}
          className="text-sm leading-6 text-slate-700"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Exemplos publicos</h2>
        <div className="mt-4 space-y-3">
          {assignment.problem.testCases.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum exemplo publico cadastrado.</p>
          ) : (
            assignment.problem.testCases.map((testCase, index) => (
              <div key={testCase.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Exemplo {index + 1}
                </p>
                <pre className="mt-2 overflow-auto rounded bg-white p-3 text-xs text-slate-700">
                  {testCase.input || '(entrada vazia)'}
                </pre>
                <p className="mt-3 text-xs font-semibold text-slate-500">Saida esperada</p>
                <pre className="mt-1 overflow-auto rounded bg-white p-3 text-xs text-slate-700">
                  {testCase.expected}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const editorPanel = assignment && (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {assignment.problem.allowedLanguages.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleLanguageChange(item)}
              className={cn(
                'rounded-md border px-3 py-2 text-xs font-semibold',
                item === language
                  ? 'border-brand-900 bg-brand-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50',
              )}
            >
              {item === 'JAVASCRIPT' ? 'JavaScript' : 'Python'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => execute('run')} disabled={isRunning || isSubmitting}>
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Executar
          </Button>
          <Button type="button" className="bg-brand-900 text-white hover:bg-brand-800" onClick={() => execute('submit')} disabled={isRunning || isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Editor
          height="min(62vh, 640px)"
          language={monacoLanguage[language]}
          value={code}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
          onChange={(value) => {
            setCode(value ?? '');
            setIsDirty(true);
          }}
          onMount={(editor, monaco) => {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => execute('run'));
            editor.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
              () => execute('submit'),
            );
          }}
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : error || !assignment ? (
        <ErrorState
          message={error ?? 'Atividade nao encontrada.'}
          action={
            <Button type="button" size="sm" variant="outline" onClick={loadData}>
              Tentar de novo
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="lg:hidden">
            <div className="grid grid-cols-4 rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold">
              {[
                ['statement', 'Enunciado'],
                ['code', 'Codigo'],
                ['result', 'Resultado'],
                ['history', 'Historico'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value as MobileTab)}
                  className={cn(
                    'rounded-md px-2 py-2',
                    activeTab === value ? 'bg-brand-900 text-white' : 'text-slate-500',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden gap-5 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="min-w-0">{statementPanel}</div>
            <div className="min-w-0 space-y-4">
              {editorPanel}
              <ResultPanel submission={activeSubmission} />
              <SubmissionHistory submissions={submissions} onSelect={setActiveSubmission} />
            </div>
          </div>

          <div className="lg:hidden">
            {activeTab === 'statement' && statementPanel}
            {activeTab === 'code' && editorPanel}
            {activeTab === 'result' && <ResultPanel submission={activeSubmission} />}
            {activeTab === 'history' && (
              <SubmissionHistory submissions={submissions} onSelect={setActiveSubmission} />
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const ResultPanel = ({ submission }: { submission: CodeSubmission | null }) => {
  if (!submission) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Execute exemplos ou envie uma submissao para ver o resultado.
      </div>
    );
  }

  const pending = submission.status === 'PENDING' || submission.status === 'RUNNING';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Resultado</h2>
          <p className="text-sm text-slate-500">
            {submission.mode === 'RUN' ? 'Execucao de exemplos' : 'Submissao oficial'}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold',
            statusClass(submission.status),
          )}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : submission.status === 'ACCEPTED' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {statusLabel[submission.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Score" value={`${submission.score}`} />
        <Metric label="Testes" value={`${submission.passedTests}/${submission.totalTests}`} />
        <Metric label="Tempo" value={submission.runtimeMs ? `${submission.runtimeMs}ms` : '-'} />
      </div>

      {submission.results && submission.results.length > 0 && (
        <div className="mt-4 space-y-3">
          {submission.results.map((result, index) => (
            <div key={result.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Teste {index + 1} {result.visibility === 'HIDDEN' ? '(oculto)' : ''}
                </span>
                <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', statusClass(result.status))}>
                  {statusLabel[result.status]}
                </span>
              </div>
              {result.visibility === 'PUBLIC' && (
                <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
                  <OutputBlock label="Entrada" value={result.input ?? ''} />
                  <OutputBlock label="Esperado" value={result.expected ?? ''} />
                  <OutputBlock label="Obtido" value={result.actual ?? result.errorMessage ?? ''} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SubmissionHistory = ({
  submissions,
  onSelect,
}: {
  submissions: CodeSubmission[];
  onSelect: (submission: CodeSubmission) => void;
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5">
    <h2 className="font-semibold text-slate-900">Historico</h2>
    {submissions.length === 0 ? (
      <p className="mt-3 text-sm text-slate-500">Nenhuma submissao ainda.</p>
    ) : (
      <div className="mt-3 space-y-2">
        {submissions.slice(0, 12).map((submission) => (
          <button
            key={submission.id}
            type="button"
            onClick={() => onSelect(submission)}
            className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4" />
              {new Date(submission.createdAt).toLocaleString('pt-BR')}
            </span>
            <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', statusClass(submission.status))}>
              {submission.mode} - {statusLabel[submission.status]}
            </span>
          </button>
        ))}
      </div>
    )}
  </div>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md bg-slate-50 p-3">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
  </div>
);

const OutputBlock = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="font-semibold text-slate-500">{label}</p>
    <pre className="mt-1 max-h-40 overflow-auto rounded bg-white p-2 text-slate-700">
      {value || '(vazio)'}
    </pre>
  </div>
);
