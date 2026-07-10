import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import {
  ActivityCodeEditor,
  ActivityProblemStatement,
  ActivitySubmissionResult,
} from "@/components/activities/ActivitySolvePanels";
import { SubmissionHistory } from "@/components/activities/SubmissionHistory";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  programmingService,
  type CodeSubmission,
  type CodeSubmissionStatus,
  type ProgrammingAssignmentSolve,
  type ProgrammingLanguage,
} from "@/services/programming-service";

type MobileTab = "statement" | "code" | "result" | "history";
const finalStatuses: CodeSubmissionStatus[] = [
  "ACCEPTED",
  "WRONG_ANSWER",
  "RUNTIME_ERROR",
  "TIME_LIMIT_EXCEEDED",
  "MEMORY_LIMIT_EXCEEDED",
  "INTERNAL_ERROR",
];
const getDefaultCode = (
  assignment: ProgrammingAssignmentSolve,
  language: ProgrammingLanguage,
) => assignment.problem.starterCode?.[language] ?? "";

export const ActivitySolvePage = () => {
  const { id } = useParams();
  const { notify } = useToast();
  const [assignment, setAssignment] =
    useState<ProgrammingAssignmentSolve | null>(null);
  const [language, setLanguage] = useState<ProgrammingLanguage>("JAVASCRIPT");
  const [code, setCode] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("statement");
  const [isDesktopLayout, setIsDesktopLayout] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(min-width: 1024px)").matches,
  );
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [activeSubmission, setActiveSubmission] =
    useState<CodeSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingLanguage, setPendingLanguage] =
    useState<ProgrammingLanguage | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextAssignment, nextSubmissions] = await Promise.all([
        programmingService.getSolveAssignment(id),
        programmingService.getMySubmissions(id),
      ]);
      const firstLanguage =
        nextAssignment.problem.allowedLanguages[0] ?? "JAVASCRIPT";
      setAssignment(nextAssignment);
      setLanguage(firstLanguage);
      setCode(getDefaultCode(nextAssignment, firstLanguage));
      setSubmissions(nextSubmissions);
      setActiveSubmission(nextSubmissions[0] ?? null);
      setIsDirty(false);
    } catch {
      setError("Não foi possível carregar a atividade.");
      notify({ title: "Falha ao carregar atividade", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [id, notify]);

  useEffect(() => {
    void loadData();
  }, [loadData]);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktopLayout(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const pollSubmission = useCallback(async (submissionId: string) => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const submission = await programmingService.getSubmission(submissionId);
      setActiveSubmission(submission);
      setSubmissions((current) =>
        current.some((item) => item.id === submission.id)
          ? current.map((item) =>
              item.id === submission.id ? submission : item,
            )
          : [submission, ...current],
      );
      if (finalStatuses.includes(submission.status)) return submission;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return null;
  }, []);

  const changeLanguage = (next: ProgrammingLanguage) => {
    if (!assignment || next === language) return;
    if (isDirty) {
      setPendingLanguage(next);
      return;
    }
    setLanguage(next);
    setCode(getDefaultCode(assignment, next));
    setIsDirty(false);
  };
  const confirmLanguageChange = () => {
    if (!assignment || !pendingLanguage) return;
    setLanguage(pendingLanguage);
    setCode(getDefaultCode(assignment, pendingLanguage));
    setPendingLanguage(null);
    setIsDirty(false);
  };
  const execute = async (mode: "run" | "submit") => {
    if (!id || !assignment) return;
    const setBusy = mode === "run" ? setIsRunning : setIsSubmitting;
    setBusy(true);
    setActiveTab("result");
    try {
      const created =
        mode === "run"
          ? await programmingService.runAssignment(id, { language, code })
          : await programmingService.submitAssignment(id, { language, code });
      setActiveSubmission(created);
      const judged = await pollSubmission(created.id);
      notify(
        judged
          ? {
              title:
                mode === "run"
                  ? "Execução dos exemplos concluída"
                  : "Avaliação concluída",
              description: `${judged.passedTests}/${judged.totalTests} testes`,
              variant: judged.status === "ACCEPTED" ? "success" : "default",
            }
          : { title: "Avaliação ainda em processamento", variant: "default" },
      );
    } catch {
      notify({
        title:
          mode === "run"
            ? "Falha ao executar exemplos"
            : "Falha ao enviar para avaliação",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };
  const dueDate = useMemo(
    () =>
      assignment?.dueDate
        ? new Date(assignment.dueDate).toLocaleString("pt-BR")
        : "Sem prazo",
    [assignment],
  );

  if (isLoading)
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[72vh] w-full rounded-lg" />
        </div>
      </DashboardLayout>
    );
  if (error || !assignment)
    return (
      <DashboardLayout>
        <ErrorState
          message={error ?? "Atividade não encontrada."}
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadData()}
            >
              Tentar de novo
            </Button>
          }
        />
      </DashboardLayout>
    );

  const statement = (
    <ActivityProblemStatement
      assignment={assignment}
      submissions={submissions}
      onSelectSubmission={(submission) => {
        setActiveSubmission(submission);
        setActiveTab("result");
      }}
    />
  );
  const editor = (
    <ActivityCodeEditor
      assignment={assignment}
      code={code}
      language={language}
      isRunning={isRunning}
      isSubmitting={isSubmitting}
      onCodeChange={(value) => {
        setCode(value);
        setIsDirty(true);
      }}
      onLanguageChange={changeLanguage}
      onRun={() => void execute("run")}
      onSubmit={() => void execute("submit")}
    />
  );

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-3">
        <header className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Link
            to="/dashboard/activities"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 hover:text-brand-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Atividades
          </Link>
          <div className="mt-2 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-brand-900">
                {assignment.title}
              </h1>
              <p className="text-sm text-slate-500">{assignment.class.name}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span>{assignment.problem.difficulty}</span>
              <span>{assignment.points} pts</span>
              <span>{assignment.problem.timeLimitMs}ms</span>
              <span>{assignment.problem.memoryLimitMb}MB</span>
              <span>{language}</span>
              <span>Prazo: {dueDate}</span>
            </div>
          </div>
        </header>
        <div className="lg:hidden">
          <div className="grid grid-cols-4 rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm">
            {(
              [
                ["statement", "Enunciado"],
                ["code", "Código"],
                ["result", "Resultado"],
                ["history", "Histórico"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                className={cn(
                  "rounded-md px-2 py-2",
                  activeTab === value
                    ? "bg-brand-900 text-white"
                    : "text-slate-500",
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
              {statement}
            </aside>
            <main className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
              {editor}
              <ActivitySubmissionResult submission={activeSubmission} />
            </main>
          </div>
        ) : (
          <div>
            {activeTab === "statement" && (
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                {statement}
              </div>
            )}
            {activeTab === "code" && editor}
            {activeTab === "result" && (
              <ActivitySubmissionResult submission={activeSubmission} />
            )}
            {activeTab === "history" && (
              <SubmissionHistory
                submissions={submissions}
                onSelect={setActiveSubmission}
              />
            )}
          </div>
        )}
      </div>
      <ConfirmAction
        open={Boolean(pendingLanguage)}
        title="Trocar linguagem?"
        description="O código atual será substituído pelo modelo inicial da nova linguagem."
        body="Copie seu código antes de continuar se quiser mantê-lo."
        confirmLabel="Trocar linguagem"
        onConfirm={confirmLanguageChange}
        onClose={() => setPendingLanguage(null)}
      />
    </DashboardLayout>
  );
};
