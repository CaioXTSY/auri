import { type FormEvent, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import axios from 'axios';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table';
import {
  adminService,
  type AdminMissionQuizDetail,
  type AdminMissionQuizPreview,
  type AdminMissionListItem,
  type GenerateMissionQuizPayload,
} from '@/services/admin-service';
import { Eye, Loader2, Sparkles, Trash2 } from 'lucide-react';

const initialGenerationForm = {
  theme: '',
  difficulty: 'MEDIO' as GenerateMissionQuizPayload['difficulty'],
  language: '',
  audience: 'alunos de graduação em computação',
  learningObjective: '',
  extraInstructions: '',
  points: '',
  startDate: '',
};

export const AdminMissions = () => {
  const [missions, setMissions] = useState<AdminMissionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generationForm, setGenerationForm] = useState(initialGenerationForm);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [missionToDelete, setMissionToDelete] = useState<AdminMissionListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quizToView, setQuizToView] = useState<AdminMissionQuizDetail | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [draftToReview, setDraftToReview] = useState<AdminMissionQuizPreview | null>(null);
  const [isApprovingDraft, setIsApprovingDraft] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.listMissions();
      setMissions(data);
    } catch {
      setError('Falha ao carregar missões.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateGenerationField = <K extends keyof typeof generationForm>(
    field: K,
    value: (typeof generationForm)[K],
  ) => {
    setGenerationForm((current) => ({ ...current, [field]: value }));
  };

  const toIsoDate = (value: string) => (value ? new Date(value).toISOString() : undefined);

  const getApiErrorMessage = (error: unknown) => {
    if (!axios.isAxiosError(error)) return 'Não foi possível gerar a questão.';

    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;

    return 'Não foi possível gerar a questão.';
  };

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsGenerating(true);

    try {
      const payload: GenerateMissionQuizPayload = {
        theme: generationForm.theme.trim(),
        difficulty: generationForm.difficulty,
        type: 'PERSONALIZADA',
        ...(generationForm.language.trim() ? { language: generationForm.language.trim() } : {}),
        ...(generationForm.audience.trim() ? { audience: generationForm.audience.trim() } : {}),
        ...(generationForm.learningObjective.trim()
          ? { learningObjective: generationForm.learningObjective.trim() }
          : {}),
        ...(generationForm.extraInstructions.trim()
          ? { extraInstructions: generationForm.extraInstructions.trim() }
          : {}),
        ...(generationForm.points.trim() && Number.isFinite(Number(generationForm.points))
          ? { points: Number(generationForm.points) }
          : {}),
        ...(generationForm.startDate ? { startDate: toIsoDate(generationForm.startDate) } : {}),
      };

      const preview = await adminService.previewMissionQuiz(payload);
      setDraftToReview(preview);
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveDraft = async () => {
    if (!draftToReview || isApprovingDraft) return;
    setError(null);
    setSuccess(null);
    setIsApprovingDraft(true);

    try {
      const created = await adminService.approveMissionQuiz(draftToReview);
      setMissions((current) => [created, ...current]);
      setGenerationForm(initialGenerationForm);
      setDraftToReview(null);
      setSuccess(`Questão aprovada e adicionada: ${created.title}`);
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setIsApprovingDraft(false);
    }
  };

  const handleDelete = async () => {
    if (!missionToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await adminService.deleteMission(missionToDelete.id);
      setMissionToDelete(null);
      await load();
    } catch {
      setError('Não foi possível remover a missão.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewQuiz = async (mission: AdminMissionListItem) => {
    if (!mission.hasQuiz) return;
    setQuizToView(null);
    setQuizError(null);
    setIsQuizLoading(true);
    try {
      const quiz = await adminService.getMissionQuiz(mission.id);
      setQuizToView(quiz);
    } catch {
      setQuizError('Não foi possível carregar a questão.');
    } finally {
      setIsQuizLoading(false);
    }
  };

  const filtered = typeFilter ? missions.filter((mission) => mission.type === typeFilter) : missions;
  const quizModalOpen = isQuizLoading || Boolean(quizToView) || Boolean(quizError);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Missões"
          description="Gere questões com IA, visualize e remova missões cadastradas na plataforma."
        />

        <SectionCard className="p-5">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Gerar questão</h2>
                <p className="text-sm text-slate-500">
                  A IA recebe estes campos e as últimas 15 questões para evitar repetição.
                </p>
              </div>
              <Button
                type="submit"
                disabled={isGenerating || !generationForm.theme.trim()}
                className="bg-brand-900 text-white hover:bg-brand-800"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? 'Gerando...' : 'Gerar prévia'}
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Field htmlFor="mission-theme" label="Tema" className="lg:col-span-2">
                <Input
                  id="mission-theme"
                  value={generationForm.theme}
                  onChange={(event) => updateGenerationField('theme', event.target.value)}
                  placeholder="ex: recursão, arrays, ponteiros, grafos"
                  maxLength={120}
                  required
                />
              </Field>

              <Field htmlFor="mission-difficulty" label="Dificuldade">
                <select
                  id="mission-difficulty"
                  value={generationForm.difficulty}
                  onChange={(event) =>
                    updateGenerationField(
                      'difficulty',
                      event.target.value as GenerateMissionQuizPayload['difficulty'],
                    )
                  }
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                >
                  <option value="FACIL">Fácil</option>
                  <option value="MEDIO">Médio</option>
                  <option value="DIFICIL">Difícil</option>
                </select>
              </Field>

              <Field htmlFor="mission-language" label="Linguagem">
                <Input
                  id="mission-language"
                  value={generationForm.language}
                  onChange={(event) => updateGenerationField('language', event.target.value)}
                  placeholder="ex: Python, JavaScript"
                  maxLength={40}
                />
              </Field>

              <Field htmlFor="mission-audience" label="Público-alvo">
                <Input
                  id="mission-audience"
                  value={generationForm.audience}
                  onChange={(event) => updateGenerationField('audience', event.target.value)}
                  maxLength={200}
                />
              </Field>

              <Field htmlFor="mission-objective" label="Objetivo">
                <Input
                  id="mission-objective"
                  value={generationForm.learningObjective}
                  onChange={(event) => updateGenerationField('learningObjective', event.target.value)}
                  placeholder="ex: rastrear fluxo de execução"
                  maxLength={240}
                />
              </Field>

              <Field htmlFor="mission-points" label="Pontos">
                <Input
                  id="mission-points"
                  type="number"
                  min={0}
                  max={1000}
                  value={generationForm.points}
                  onChange={(event) => updateGenerationField('points', event.target.value)}
                  placeholder="auto"
                />
              </Field>

              <Field htmlFor="mission-start-date" label="Início">
                <Input
                  id="mission-start-date"
                  type="datetime-local"
                  value={generationForm.startDate}
                  onChange={(event) => updateGenerationField('startDate', event.target.value)}
                />
              </Field>

            </div>

            <Field htmlFor="mission-extra-instructions" label="Instruções extras">
              <textarea
                id="mission-extra-instructions"
                value={generationForm.extraInstructions}
                onChange={(event) => updateGenerationField('extraInstructions', event.target.value)}
                placeholder="ex: use um bloco de código curto, evite pegadinhas de sintaxe"
                rows={3}
                maxLength={600}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </Field>
          </form>
        </SectionCard>

        <SectionCard className="p-4">
          <Field htmlFor="missions-type-filter" label="Filtrar por tipo" className="max-w-sm">
            <select
              id="missions-type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
            >
              <option value="">Todos os tipos</option>
              <option value="DIARIA">Diária</option>
              <option value="SEMANAL">Semanal</option>
              <option value="PERSONALIZADA">Personalizada</option>
            </select>
          </Field>
        </SectionCard>

        {error ? <ErrorState message={error} /> : null}
        {success ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Nenhuma missão encontrada para o filtro atual." />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Título</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Pontos</TableHeaderCell>
                  <TableHeaderCell>Início</TableHeaderCell>
                  <TableHeaderCell>Disponibilidade</TableHeaderCell>
                  <TableHeaderCell>Quiz</TableHeaderCell>
                  <TableHeaderCell className="text-right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {filtered.map((mission) => (
                  <TableRow key={mission.id}>
                    <TableCell className="font-medium text-slate-800">{mission.title}</TableCell>
                    <TableCell className="text-slate-600">{mission.type}</TableCell>
                    <TableCell className="text-slate-600">{mission.points}</TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(mission.startDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-slate-600">Permanente</TableCell>
                    <TableCell className="text-slate-600">{mission.hasQuiz ? 'Sim' : 'Não'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-3">
                        {mission.hasQuiz ? (
                          <button
                            type="button"
                            onClick={() => handleViewQuiz(mission)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900"
                          >
                            <Eye className="h-3 w-3" /> Ver
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setMissionToDelete(mission)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 className="h-3 w-3" /> Remover
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}

        <ModalDialog
          open={Boolean(draftToReview)}
          title={draftToReview?.title ?? 'Revisar questão'}
          description="Confira a questão antes de adicioná-la ao banco permanente de missões."
          onClose={() => {
            if (isApprovingDraft) return;
            setDraftToReview(null);
          }}
          panelClassName="max-w-4xl"
          closeOnOverlay={!isApprovingDraft}
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 text-slate-600"
                onClick={() => setDraftToReview(null)}
                disabled={isApprovingDraft}
              >
                Recusar
              </Button>
              <Button
                type="button"
                className="bg-brand-900 text-white hover:bg-brand-800"
                onClick={handleApproveDraft}
                disabled={isApprovingDraft}
              >
                {isApprovingDraft ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Aprovar e adicionar'
                )}
              </Button>
            </div>
          }
        >
          {draftToReview ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold uppercase tracking-wide text-slate-600">
                  {draftToReview.difficulty}
                </span>
                <span className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold uppercase tracking-wide text-slate-600">
                  {draftToReview.points} XP
                </span>
                <span className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold uppercase tracking-wide text-slate-600">
                  Prévia
                </span>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-700">
                <MarkdownContent content={draftToReview.question} />
              </div>

              <div className="space-y-3">
                {draftToReview.options.map((option, index) => {
                  const isCorrect = index === draftToReview.correctIndex;

                  return (
                    <div
                      key={`${option}-${index}`}
                      className={`rounded-md border px-4 py-3 ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isCorrect
                              ? 'border-emerald-500 text-emerald-700'
                              : 'border-slate-300 text-slate-500'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800">{option}</p>
                            {isCorrect ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                                Correta
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs leading-relaxed text-slate-600">
                            <MarkdownContent content={String(draftToReview.explanations[index] ?? '')} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </ModalDialog>

        <ModalDialog
          open={quizModalOpen}
          title={quizToView?.title ?? 'Questão da missão'}
          description="Prévia completa da questão, gabarito e explicações."
          onClose={() => {
            if (isQuizLoading) return;
            setQuizToView(null);
            setQuizError(null);
          }}
          panelClassName="max-w-4xl"
          footer={
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 text-slate-600"
                onClick={() => {
                  setQuizToView(null);
                  setQuizError(null);
                }}
                disabled={isQuizLoading}
              >
                Fechar
              </Button>
            </div>
          }
        >
          {isQuizLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : quizError ? (
            <ErrorState message={quizError} />
          ) : quizToView ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold uppercase tracking-wide text-slate-600">
                  {quizToView.difficulty}
                </span>
                <span className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold uppercase tracking-wide text-slate-600">
                  {quizToView.mission.points} XP
                </span>
                <span className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold uppercase tracking-wide text-slate-600">
                  {quizToView.mission.type}
                </span>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-700">
                <MarkdownContent content={quizToView.question} />
              </div>

              <div className="space-y-3">
                {quizToView.options.map((option, index) => {
                  const isCorrect = index === quizToView.correctIndex;

                  return (
                    <div
                      key={`${option}-${index}`}
                      className={`rounded-md border px-4 py-3 ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isCorrect
                              ? 'border-emerald-500 text-emerald-700'
                              : 'border-slate-300 text-slate-500'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800">{option}</p>
                            {isCorrect ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                                Correta
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs leading-relaxed text-slate-600">
                            <MarkdownContent content={String(quizToView.explanations[index] ?? '')} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </ModalDialog>

        <ConfirmAction
          open={Boolean(missionToDelete)}
          title="Remover missão"
          description="Essa ação é irreversível."
          body={
            missionToDelete ? (
              <p>
                Deletar a missão <strong>{missionToDelete.title}</strong>?
              </p>
            ) : null
          }
          confirmLabel="Remover"
          destructive
          isConfirming={isDeleting}
          onConfirm={handleDelete}
          onClose={() => {
            if (isDeleting) return;
            setMissionToDelete(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
};
