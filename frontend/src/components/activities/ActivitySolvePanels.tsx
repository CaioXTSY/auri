import Editor from "@monaco-editor/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  Loader2,
  Play,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { SubmissionHistory } from "@/components/activities/SubmissionHistory";
import { ACTIVITY_COPY } from "@/constants/ui-terminology";
import { cn } from "@/lib/utils";
import type {
  CodeSubmission,
  CodeSubmissionStatus,
  ProgrammingAssignmentSolve,
  ProgrammingLanguage,
} from "@/services/programming-service";

const languageLabel: Record<ProgrammingLanguage, string> = {
  JAVASCRIPT: "JavaScript",
  PYTHON: "Python",
};
const monacoLanguage: Record<ProgrammingLanguage, string> = {
  JAVASCRIPT: "javascript",
  PYTHON: "python",
};
const statusLabel: Record<CodeSubmissionStatus, string> = {
  PENDING: "Aguardando avaliação",
  RUNNING: "Executando",
  ACCEPTED: "Resposta correta",
  WRONG_ANSWER: "Saída diferente",
  RUNTIME_ERROR: "Erro de execução",
  TIME_LIMIT_EXCEEDED: "Tempo excedido",
  MEMORY_LIMIT_EXCEEDED: "Memória excedida",
  INTERNAL_ERROR: "Falha interna da plataforma",
};
const statusMessage: Record<CodeSubmissionStatus, string> = {
  PENDING: "Sua avaliação entrou na fila do judge.",
  RUNNING: "Seu código está sendo executado em ambiente isolado.",
  ACCEPTED: "Todos os testes avaliados passaram.",
  WRONG_ANSWER: "Seu código executou, mas a saída não bateu com o esperado.",
  RUNTIME_ERROR: "Seu código gerou um erro durante a execução.",
  TIME_LIMIT_EXCEEDED: "Seu código excedeu o limite de tempo.",
  MEMORY_LIMIT_EXCEEDED: "Seu código excedeu o limite de memória.",
  INTERNAL_ERROR:
    "A plataforma encontrou uma falha ao avaliar sua tentativa. Isso não indica um erro no seu código; tente novamente em instantes.",
};

const getTone = (status?: CodeSubmissionStatus) => {
  if (status === "ACCEPTED")
    return {
      shell: "border-emerald-200 bg-emerald-50 text-emerald-800",
      icon: CheckCircle2,
    };
  if (status === "PENDING" || status === "RUNNING")
    return { shell: "border-blue-200 bg-blue-50 text-blue-800", icon: Loader2 };
  if (status === "WRONG_ANSWER")
    return {
      shell: "border-amber-200 bg-amber-50 text-amber-800",
      icon: AlertTriangle,
    };
  if (status === "INTERNAL_ERROR")
    return {
      shell: "border-violet-200 bg-violet-50 text-violet-800",
      icon: ShieldAlert,
    };
  if (!status)
    return {
      shell: "border-slate-200 bg-slate-50 text-slate-600",
      icon: Clock3,
    };
  return { shell: "border-red-200 bg-red-50 text-red-800", icon: XCircle };
};

const getContractHint = (submission: CodeSubmission) => {
  const message = [
    submission.errorMessage,
    ...(submission.results?.map((result) => result.errorMessage) ?? []),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  if (
    submission.status === "WRONG_ANSWER" &&
    submission.results?.some(
      (result) => result.visibility === "PUBLIC" && !result.actual,
    )
  )
    return "A saída ficou vazia. Verifique se sua função retorna uma string ou número.";
  if (submission.status !== "RUNTIME_ERROR") return null;
  if (
    submission.language === "PYTHON" &&
    (message.includes("solve") || message.includes("keyerror"))
  )
    return "Em Python, defina exatamente: def solve(input: str) -> str.";
  if (
    submission.language === "JAVASCRIPT" &&
    (message.includes("solve") ||
      message.includes("module.exports") ||
      message.includes("not a function") ||
      message.includes("cannot find module"))
  )
    return "Em JavaScript, exporte a função com: module.exports = solve.";
  return "Confira se a função solve existe, recebe input como texto e retorna a resposta.";
};

const OutputBlock = ({
  label,
  value,
  error = false,
}: {
  label: string;
  value: string;
  error?: boolean;
}) => (
  <div>
    <p className="font-semibold text-slate-500">{label}</p>
    <pre
      className={cn(
        "mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded border p-2 font-mono text-xs leading-relaxed",
        error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 bg-white text-slate-700",
      )}
    >
      {value || "(vazio)"}
    </pre>
  </div>
);

export const ActivityProblemStatement = ({
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
          Exemplos públicos
        </div>
        <div className="space-y-3">
          {assignment.problem.testCases.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum exemplo público cadastrado.
            </p>
          ) : (
            assignment.problem.testCases.map((testCase, index) => (
              <div
                key={testCase.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Exemplo {index + 1}
                </p>
                <OutputBlock
                  label="Entrada"
                  value={testCase.input || "(entrada vazia)"}
                />
                <OutputBlock label="Saída esperada" value={testCase.expected} />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
    <div className="border-t border-slate-200 bg-slate-50 p-4">
      <SubmissionHistory
        compact
        submissions={submissions}
        onSelect={onSelectSubmission}
      />
    </div>
  </div>
);

export const ActivityCodeEditor = ({
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
  <section className="grid min-h-[520px] grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-white p-1">
        {assignment.problem.allowedLanguages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onLanguageChange(item)}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-semibold transition-colors",
              item === language
                ? "bg-brand-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-brand-900",
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
        >
          {isRunning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {ACTIVITY_COPY.runExamples}
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isRunning || isSubmitting}
          className="bg-accent-600 font-bold text-brand-950 hover:bg-accent-700"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {ACTIVITY_COPY.sendForEvaluation}
        </Button>
      </div>
    </div>
    <div className="space-y-1 border-b border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500">
      <p>
        {ACTIVITY_COPY.examplesDoNotAwardPoints}{" "}
        {ACTIVITY_COPY.evaluationUsesHiddenTests}
      </p>
      <p>
        Você recebe apenas a diferença em relação à sua melhor pontuação
        anterior.
      </p>
    </div>
    <div className="min-h-0 bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={monacoLanguage[language]}
        value={code}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          lineNumbersMinChars: 3,
        }}
        onChange={(value) => onCodeChange(value ?? "")}
        onMount={(editor, monaco) => {
          editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            onRun,
          );
          editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
            onSubmit,
          );
        }}
      />
    </div>
  </section>
);

export const ActivitySubmissionResult = ({
  submission,
}: {
  submission: CodeSubmission | null;
}) => {
  if (!submission)
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        {ACTIVITY_COPY.runExamples} ou use{" "}
        {ACTIVITY_COPY.sendForEvaluation.toLowerCase()} para ver o feedback
        aqui.
      </section>
    );
  const tone = getTone(submission.status);
  const Icon = tone.icon;
  const pending =
    submission.status === "PENDING" || submission.status === "RUNNING";
  const hint = getContractHint(submission);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {submission.mode === "RUN"
              ? ACTIVITY_COPY.examplesResult
              : ACTIVITY_COPY.evaluationResult}
          </p>
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
              tone.shell,
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn("h-4 w-4", pending && "animate-spin")}
            />
            {statusLabel[submission.status]}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {statusMessage[submission.status]}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            Score
            <br />
            <strong>{submission.score}</strong>
          </div>
          <div>
            Testes
            <br />
            <strong>
              {submission.passedTests}/{submission.totalTests}
            </strong>
          </div>
          <div>
            Tempo
            <br />
            <strong>
              {submission.runtimeMs ? `${submission.runtimeMs}ms` : "-"}
            </strong>
          </div>
        </div>
      </div>
      {hint && (
        <div className="mt-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {hint}
        </div>
      )}
      {submission.status === "INTERNAL_ERROR" && (
        <div className="mt-3 flex gap-2 rounded-md border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />A falha ocorreu
          durante a avaliação da plataforma. Seu código não foi marcado como
          incorreto.
        </div>
      )}
      {submission.results?.length ? (
        <div className="mt-4 space-y-3">
          {submission.results.map((result, index) => {
            const resultTone = getTone(result.status);
            return (
              <div
                key={result.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    Teste {index + 1}{" "}
                    {result.visibility === "HIDDEN" ? "(oculto)" : ""}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-semibold",
                      resultTone.shell,
                    )}
                  >
                    {statusLabel[result.status]}
                  </span>
                </div>
                {result.visibility === "PUBLIC" ? (
                  <div className="mt-3 space-y-3 text-xs">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <OutputBlock label="Entrada" value={result.input ?? ""} />
                      <OutputBlock
                        label="Esperado"
                        value={result.expected ?? ""}
                      />
                    </div>
                    {result.errorMessage ? (
                      <OutputBlock
                        label="Erro"
                        value={result.errorMessage}
                        error
                      />
                    ) : (
                      <OutputBlock label="Obtido" value={result.actual ?? ""} />
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Teste oculto. Apenas o status é exibido.
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
