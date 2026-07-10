import Editor from '@monaco-editor/react';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  History,
  Loader2,
  Play,
  Send,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { ACTIVITY_COPY } from '@/constants/ui-terminology';
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

const statusMessage: Record<CodeSubmissionStatus, string> = {
  PENDING: 'Sua execucao entrou na fila do judge.',
  RUNNING: 'Seu codigo esta sendo executado em ambiente isolado.',
  ACCEPTED: 'Todos os testes avaliados passaram.',
  WRONG_ANSWER: 'Seu codigo executou, mas a saida nao bateu com o esperado.',
  RUNTIME_ERROR: 'Seu codigo gerou erro durante a execucao.',
  TIME_LIMIT_EXCEEDED: 'Seu codigo excedeu o limite de tempo.',
  MEMORY_LIMIT_EXCEEDED: 'Seu codigo excedeu o limite de memoria.',
  INTERNAL_ERROR: 'O judge encontrou uma falha interna. Tente novamente em instantes.',
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

const languageLabel: Record<ProgrammingLanguage, string> = {
  JAVASCRIPT: 'JavaScript',
  PYTHON: 'Python',
};

const getDefaultCode = (
  assignment: ProgrammingAssignmentSolve,
  language: ProgrammingLanguage,
) => assignment.problem.starterCode?.[language] ?? '';

const getStatusTone = (status?: CodeSubmissionStatus) => {
  if (status === 'ACCEPTED') {
    return {
      shell: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      accent: 'text-emerald-700',
      icon: CheckCircle2,
    };
  }

  if (status === 'PENDING' || status === 'RUNNING') {
    return {
      shell: 'border-blue-200 bg-blue-50 text-blue-800',
      accent: 'text-blue-700',
      icon: Loader2,
    };
  }

  if (!status) {
    return {
      shell: 'border-slate-200 bg-slate-50 text-slate-600',
      accent: 'text-slate-600',
      icon: Clock3,
    };
  }

  if (status === 'WRONG_ANSWER') {
    return {
      shell: 'border-amber-200 bg-amber-50 text-amber-800',
      accent: 'text-amber-700',
      icon: AlertTriangle,
    };
  }

  return {
    shell: 'border-red-200 bg-red-50 text-red-800',
    accent: 'text-red-700',
    icon: XCircle,
  };
};

const getContractHint = (
  submission: CodeSubmission,
  language: ProgrammingLanguage,
) => {
  const message = [
    submission.errorMessage,
    ...(submission.results?.map((result) => result.errorMessage) ?? []),
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();

  if (submission.status !== 'RUNTIME_ERROR') {
    if (
      submission.status === 'WRONG_ANSWER' &&
      submission.results?.some((result) => result.visibility === 'PUBLIC' && !result.actual)
    ) {
      return 'A saida ficou vazia. Verifique se sua funcao retorna uma string ou numero.';
    }
    return null;
  }

  if (language === 'PYTHON' && (message.includes('solve') || message.includes('keyerror'))) {
    return 'Em Python, defina exatamente: def solve(input: str) -> str.';
  }

  if (
    language === 'JAVASCRIPT' &&
    (message.includes('solve') ||
      message.includes('module.exports') ||
      message.includes('not a function') ||
      message.includes('cannot find module'))
  ) {
    return 'Em JavaScript, exporte a funcao com: module.exports = solve.';
  }

  return 'Confira se a funcao solve existe, recebe input como texto e retorna a resposta.';
};

export const ActivitySolvePage = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<ProgrammingAssignmentSolve | null>(null);
  const [language, setLanguage] = useState<ProgrammingLanguage>('JAVASCRIPT');
  const [code, setCode] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('statement');
  const [isDesktopLayout, setIsDesktopLayout] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches,
  );
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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => setIsDesktopLayout(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const pollSubmission = useCallback(async (submissionId: string) => {
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
  }, []);

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
          title: 'Avaliação ainda em processamento',
          description: 'O resultado sera atualizado no historico em instantes.',
          variant: 'default',
        });
        return;
      }

      notify({
        title: mode === 'run' ? 'Execução dos exemplos concluída' : 'Avaliação concluída',
        description: `${statusLabel[judged.status]} - ${judged.passedTests}/${judged.totalTests} testes`,
        variant: judged.status === 'ACCEPTED' ? 'success' : 'default',
      });
    } catch {
      notify({
        title:
          mode === 'run'
            ? 'Falha ao executar exemplos'
            : 'Falha ao enviar para avaliação',
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[72vh] w-full rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assignment) {
    return (
      <DashboardLayout>
        <ErrorState
          message={error ?? 'Atividade nao encontrada.'}
          action={
            <Button type="button" size="sm" variant="outline" onClick={loadData}>
              Tentar de novo
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  const statementPanel = (
    <StatementPanel
      assignment={assignment}
      submissions={submissions}
      onSelectSubmission={(submission) => {
        setActiveSubmission(submission);
        setActiveTab('result');
      }}
    />
  );

  const editorPanel = (
    <EditorWorkspace
      assignment={assignment}
      code={code}
      language={language}
      isRunning={isRunning}
      isSubmitting={isSubmitting}
      onCodeChange={(value) => {
        setCode(value);
        setIsDirty(true);
      }}
      onLanguageChange={handleLanguageChange}
      onRun={() => execute('run')}
      onSubmit={() => execute('submit')}
    />
  );

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-3">
        <ActivityHeader assignment={assignment} dueDate={dueDate} language={language} />

        <div className="lg:hidden">
          <div className="grid grid-cols-4 rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm">
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

        {isDesktopLayout ? (
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(330px,0.82fr)_minmax(520px,1.18fr)] gap-3">
            <aside className="min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              {statementPanel}
            </aside>
            <main className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
              {editorPanel}
              <ResultPanel submission={activeSubmission} />
            </main>
          </div>
        ) : (
          <div>
            {activeTab === 'statement' && (
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">{statementPanel}</div>
            )}
            {activeTab === 'code' && editorPanel}
            {activeTab === 'result' && <ResultPanel submission={activeSubmission} />}
            {activeTab === 'history' && (
              <SubmissionHistory submissions={submissions} onSelect={setActiveSubmission} />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const ActivityHeader = ({
  assignment,
  dueDate,
  language,
}: {
  assignment: ProgrammingAssignmentSolve;
  dueDate: string;
  language: ProgrammingLanguage;
}) => (
  <header className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <Link
          to="/dashboard/activities"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 hover:text-brand-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Atividades
        </Link>
        <h1 className="mt-1 truncate font-display text-xl font-bold text-brand-900">
          {assignment.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {assignment.class.name}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>{assignment.problem.difficulty}</Badge>
        <Badge>{assignment.points} pts</Badge>
        <Badge>{assignment.problem.timeLimitMs}ms</Badge>
        <Badge>{assignment.problem.memoryLimitMb}MB</Badge>
        <Badge>{languageLabel[language]}</Badge>
        <Badge tone="deadline">Prazo: {dueDate}</Badge>
      </div>
    </div>
  </header>
);

const StatementPanel = ({
  assignment,
  submissions,
  onSelectSubmission,
}: {
  assignment: ProgrammingAssignmentSolve;
  submissions: CodeSubmission[];
  onSelectSubmission: (submission: CodeSubmission) => void;
}) => (
  <div className="flex h-full min-h-0 flex-col">
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <section>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-900">
          <FileText className="h-4 w-4" />
          Enunciado
        </div>
        <MarkdownContent
          content={assignment.problem.statement}
          className="text-[15px] leading-7 text-slate-700 [&_h1]:text-xl [&_h2]:mt-5 [&_h2]:text-base [&_h3]:mt-4 [&_p]:text-slate-700 [&_pre]:text-[13px]"
        />
      </section>

      <section className="mt-6 border-t border-slate-200 pt-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-900">
          <Code2 className="h-4 w-4" />
          Exemplos publicos
        </div>
        <div className="space-y-3">
          {assignment.problem.testCases.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum exemplo publico cadastrado.</p>
          ) : (
            assignment.problem.testCases.map((testCase, index) => (
              <div key={testCase.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Exemplo {index + 1}
                </p>
                <OutputBlock label="Entrada" value={testCase.input || '(entrada vazia)'} />
                <OutputBlock label="Saida esperada" value={testCase.expected} />
              </div>
            ))
          )}
        </div>
      </section>
    </div>

    <div className="border-t border-slate-200 bg-slate-50 p-4">
      <SubmissionHistory compact submissions={submissions} onSelect={onSelectSubmission} />
    </div>
  </div>
);

const EditorWorkspace = ({
  assignment,
  code,
  language,
  isRunning,
  isSubmitting,
  onCodeChange,
  onLanguageChange,
  onRun,
  onSubmit,
}: {
  assignment: ProgrammingAssignmentSolve;
  code: string;
  language: ProgrammingLanguage;
  isRunning: boolean;
  isSubmitting: boolean;
  onCodeChange: (value: string) => void;
  onLanguageChange: (language: ProgrammingLanguage) => void;
  onRun: () => void;
  onSubmit: () => void;
}) => (
  <section className="grid min-h-[520px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-white p-1">
        {assignment.problem.allowedLanguages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onLanguageChange(item)}
            className={cn(
              'rounded px-3 py-1.5 text-xs font-semibold transition-colors',
              item === language
                ? 'bg-brand-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-brand-900',
            )}
          >
            {languageLabel[item]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onRun}
          disabled={isRunning || isSubmitting}
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        >
          {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          {ACTIVITY_COPY.runExamples}
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isRunning || isSubmitting}
          className="bg-accent-600 font-bold text-brand-950 hover:bg-accent-700"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {ACTIVITY_COPY.sendForEvaluation}
        </Button>
      </div>
    </div>

    <p className="border-b border-slate-200 bg-white px-4 pb-3 text-xs leading-5 text-slate-500">
      {ACTIVITY_COPY.examplesDoNotAwardPoints} {ACTIVITY_COPY.evaluationUsesHiddenTests}
    </p>

    <div className="min-h-0 bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={monacoLanguage[language]}
        value={code}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          lineNumbersMinChars: 3,
        }}
        onChange={(value) => onCodeChange(value ?? '')}
        onMount={(editor, monaco) => {
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);
          editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
            onSubmit,
          );
        }}
      />
    </div>
  </section>
);

const ResultPanel = ({ submission }: { submission: CodeSubmission | null }) => {
  if (!submission) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        {ACTIVITY_COPY.runExamples} ou use {ACTIVITY_COPY.sendForEvaluation.toLowerCase()} para ver o feedback aqui.
      </section>
    );
  }

  const tone = getStatusTone(submission.status);
  const StatusIcon = tone.icon;
  const pending = submission.status === 'PENDING' || submission.status === 'RUNNING';
  const hint = getContractHint(submission, submission.language);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {submission.mode === 'RUN'
              ? ACTIVITY_COPY.examplesResult
              : ACTIVITY_COPY.evaluationResult}
          </p>
          <div className={cn('mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold', tone.shell)}>
            <StatusIcon className={cn('h-4 w-4', pending && 'animate-spin')} />
            {statusLabel[submission.status]}
          </div>
          <p className="mt-2 text-sm text-slate-600">{statusMessage[submission.status]}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Score" value={`${submission.score}`} />
          <Metric label="Testes" value={`${submission.passedTests}/${submission.totalTests}`} />
          <Metric label="Tempo" value={submission.runtimeMs ? `${submission.runtimeMs}ms` : '-'} />
        </div>
      </div>

      {hint ? (
        <div className="mt-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{hint}</span>
        </div>
      ) : null}

      {submission.results && submission.results.length > 0 ? (
        <div className="mt-4 space-y-3">
          {submission.results.map((result, index) => {
            const resultTone = getStatusTone(result.status);
            const hasError = Boolean(result.errorMessage);
            return (
              <div key={result.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    Teste {index + 1} {result.visibility === 'HIDDEN' ? '(oculto)' : ''}
                  </span>
                  <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', resultTone.shell)}>
                    {statusLabel[result.status]}
                  </span>
                </div>

                {result.visibility === 'PUBLIC' ? (
                  <div className="mt-3 space-y-3 text-xs">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <OutputBlock label="Entrada" value={result.input ?? ''} compact />
                      <OutputBlock label="Esperado" value={result.expected ?? ''} compact />
                    </div>
                    {hasError ? (
                      <OutputBlock
                        label="Erro"
                        value={result.errorMessage ?? ''}
                        tone="error"
                      />
                    ) : (
                      <OutputBlock label="Obtido" value={result.actual ?? ''} />
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Teste oculto. Apenas o status e exibido.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

const SubmissionHistory = ({
  submissions,
  onSelect,
  compact = false,
}: {
  submissions: CodeSubmission[];
  onSelect: (submission: CodeSubmission) => void;
  compact?: boolean;
}) => (
  <section>
    <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
      <History className="h-4 w-4" />
      Historico
    </div>
    {submissions.length === 0 ? (
      <p className="mt-3 text-sm text-slate-500">Nenhuma execucao ainda.</p>
    ) : (
      <div className={cn('mt-3 space-y-2', compact && 'max-h-48 overflow-y-auto pr-1')}>
        {submissions.slice(0, compact ? 8 : 16).map((submission) => {
          const tone = getStatusTone(submission.status);
          return (
            <button
              key={submission.id}
              type="button"
              onClick={() => onSelect(submission)}
              className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-brand-200 hover:bg-slate-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-slate-700">
                  {new Date(submission.createdAt).toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-slate-500">
                  {submission.mode === 'RUN' ? 'Execução dos exemplos' : 'Avaliação enviada'}
                </span>
              </span>
              <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold', tone.shell)}>
                {statusLabel[submission.status]}
              </span>
            </button>
          );
        })}
      </div>
    )}
  </section>
);

const Badge = ({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'deadline';
}) => (
  <span
    className={cn(
      'rounded-full border px-2.5 py-1 text-xs font-semibold',
      tone === 'deadline'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-slate-200 bg-slate-50 text-slate-700',
    )}
  >
    {children}
  </span>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-20 rounded-md bg-slate-50 px-3 py-2">
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-0.5 text-base font-bold text-slate-900">{value}</p>
  </div>
);

const OutputBlock = ({
  label,
  value,
  tone = 'default',
  compact = false,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'error';
  compact?: boolean;
}) => (
  <div>
    <p className="font-semibold text-slate-500">{label}</p>
    <pre
      className={cn(
        'mt-1 overflow-auto whitespace-pre-wrap break-words rounded border p-2 font-mono text-xs leading-relaxed',
        compact ? 'max-h-28 min-h-9' : 'max-h-72 min-h-20',
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-800 selection:bg-red-200'
          : 'border-slate-200 bg-white text-slate-700',
      )}
    >
      {value || '(vazio)'}
    </pre>
  </div>
);
