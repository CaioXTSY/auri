import { type FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { Eye, Loader2, Plus, Trash2 } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
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
  type AdminMissionListItem,
  type AdminMissionQuizDetail,
  type CreateManualMissionQuizPayload,
} from '@/services/admin-service';

const initialMissionForm = {
  title: '',
  question: '',
  difficulty: 'MEDIO' as CreateManualMissionQuizPayload['difficulty'],
  options: ['', '', '', ''],
  explanations: ['', '', '', ''],
  correctIndex: 0,
  points: '',
};

const exampleMissionForm = {
  title: 'Escopo, closures e mutabilidade em Python',
  question:
    'Considere o código Python abaixo, que combina função aninhada, estado compartilhado e uma lista mutável:\n\n```python\ndef montar_registrador():\n    historico = []\n    total = 0\n\n    def registrar(valor):\n        nonlocal total\n        historico.append(valor)\n        if valor % 2 == 0:\n            total += valor\n        else:\n            total += len(historico)\n        return total\n\n    return registrar, historico\n\nregistrar, dados = montar_registrador()\nprint(registrar(3))\nprint(registrar(4))\ndados.append(10)\nprint(registrar(5))\nprint(dados)\n```\n\nQual alternativa descreve corretamente as saídas e a razão principal do resultado?',
  difficulty: 'DIFICIL' as CreateManualMissionQuizPayload['difficulty'],
  options: [
    '1, 5, 8 e [3, 4, 10, 5]',
    '1, 5, 9 e [3, 4, 10, 5]',
    '3, 7, 12 e [3, 4, 10, 5]',
    '1, 5, 9 e [3, 4, 5]',
  ],
  explanations: [
    'Incorreta. A terceira chamada soma len(historico), que vale 4 após o append interno de 5, não 3.',
    'Correta. total começa em 0; registrar(3) soma len([3]) = 1; registrar(4) soma 4; dados aponta para a mesma lista historico, então append(10) afeta o tamanho antes de registrar(5), que soma len([3,4,10,5]) = 4.',
    'Incorreta. Valores ímpares não são somados diretamente; o código soma o tamanho atual do histórico.',
    'Incorreta. dados referencia a mesma lista historico, então o append externo de 10 permanece visível no resultado final.',
  ],
  correctIndex: 1,
  points: '140',
};

const missionTypeFilters = [
  { value: '', label: 'Todos' },
  { value: 'DIARIA', label: 'Diárias' },
  { value: 'SEMANAL', label: 'Semanais' },
  { value: 'PERSONALIZADA', label: 'Personalizadas' },
];

const AdminMissionsTableSkeleton = () => (
  <TableContainer>
    <Table>
      <TableHead>
        <tr>
          {['Título', 'Tipo', 'Pontos', 'Início', 'Disponibilidade', 'Quiz', 'Ações'].map((header) => (
            <TableHeaderCell key={header} className={header === 'Ações' ? 'text-right' : undefined}>
              {header}
            </TableHeaderCell>
          ))}
        </tr>
      </TableHead>
      <tbody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="space-y-2">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-3 w-28" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-24 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-10" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-10" />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-3">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-14" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  </TableContainer>
);

const QuizDetailSkeleton = () => (
  <div className="space-y-5">
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-28 rounded-full" />
    </div>
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-5/6" />
      <Skeleton className="mt-3 h-4 w-2/3" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-md border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-4/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AdminMissions = () => {
  const [missions, setMissions] = useState<AdminMissionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [missionForm, setMissionForm] = useState(initialMissionForm);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [missionToDelete, setMissionToDelete] = useState<AdminMissionListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quizToView, setQuizToView] = useState<AdminMissionQuizDetail | null>(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

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

  const updateMissionField = <K extends keyof typeof missionForm>(
    field: K,
    value: (typeof missionForm)[K],
  ) => {
    setMissionForm((current) => ({ ...current, [field]: value }));
  };

  const updateOption = (index: number, value: string) => {
    setMissionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (optionIndex === index ? value : option)),
    }));
  };

  const updateExplanation = (index: number, value: string) => {
    setMissionForm((current) => ({
      ...current,
      explanations: current.explanations.map((explanation, explanationIndex) =>
        explanationIndex === index ? value : explanation,
      ),
    }));
  };

  const getApiErrorMessage = (error: unknown) => {
    if (!axios.isAxiosError(error)) return 'Não foi possível criar a questão.';

    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;

    return 'Não foi possível criar a questão.';
  };

  const canCreate =
    missionForm.title.trim() &&
    missionForm.question.trim() &&
    missionForm.options.every((option) => option.trim());

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsCreating(true);

    try {
      const payload: CreateManualMissionQuizPayload = {
        title: missionForm.title.trim(),
        question: missionForm.question.trim(),
        difficulty: missionForm.difficulty,
        options: missionForm.options.map((option) => option.trim()),
        explanations: missionForm.explanations.map((explanation) => explanation.trim()),
        correctIndex: missionForm.correctIndex,
        ...(missionForm.points.trim() && Number.isFinite(Number(missionForm.points))
          ? { points: Number(missionForm.points) }
          : {}),
      };

      const created = await adminService.createManualMissionQuiz(payload);
      setMissions((current) => [created, ...current]);
      setMissionForm(initialMissionForm);
      setIsCreateModalOpen(false);
      setSuccess(`Questão criada: ${created.title}`);
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setIsCreating(false);
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

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Missões"
          description="Crie questões manuais, visualize e remova missões cadastradas na plataforma."
        />

        <SectionCard className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Criar questão manual</h2>
                <p className="text-sm text-slate-500">
                  A missão criada fica disponível permanentemente no banco de missões da plataforma.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-brand-900 text-white hover:bg-brand-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova questão
            </Button>
          </div>
        </SectionCard>

        {error ? <ErrorState message={error} /> : null}
        {success ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Missões cadastradas</h2>
            <p className="text-xs text-slate-500">
              {filtered.length} de {missions.length} missões
            </p>
          </div>
          <div className="inline-flex w-full gap-1 rounded-md border border-slate-200 bg-slate-50 p-1 sm:w-auto">
            {missionTypeFilters.map((filter) => {
              const isActive = typeFilter === filter.value;

              return (
                <button
                  key={filter.value || 'all'}
                  type="button"
                  onClick={() => setTypeFilter(filter.value)}
                  className={`h-9 flex-1 rounded px-3 text-xs font-semibold transition sm:flex-none ${
                    isActive
                      ? 'bg-white text-brand-900 shadow-sm'
                      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <AdminMissionsTableSkeleton />
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
          open={isCreateModalOpen}
          title="Criar questão manual"
          description="Preencha os campos da questão e marque a alternativa correta."
          onClose={closeCreateModal}
          closeOnOverlay={!isCreating}
          panelClassName="max-w-5xl"
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 text-slate-600"
                onClick={() => setMissionForm(exampleMissionForm)}
                disabled={isCreating}
              >
                Usar exemplo
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-200 text-slate-600"
                  onClick={closeCreateModal}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="manual-mission-form"
                  disabled={isCreating || !canCreate}
                  className="bg-brand-900 text-white hover:bg-brand-800"
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {isCreating ? 'Criando...' : 'Criar questão'}
                </Button>
              </div>
            </div>
          }
        >
          <form id="manual-mission-form" onSubmit={handleCreate} className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <Field htmlFor="mission-title" label="Título" className="lg:col-span-2">
                <Input
                  id="mission-title"
                  value={missionForm.title}
                  onChange={(event) => updateMissionField('title', event.target.value)}
                  placeholder="ex: Escopo e mutabilidade em Python"
                  maxLength={200}
                  required
                />
              </Field>

              <Field htmlFor="mission-difficulty" label="Dificuldade">
                <select
                  id="mission-difficulty"
                  value={missionForm.difficulty}
                  onChange={(event) =>
                    updateMissionField(
                      'difficulty',
                      event.target.value as CreateManualMissionQuizPayload['difficulty'],
                    )
                  }
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                >
                  <option value="FACIL">Fácil</option>
                  <option value="MEDIO">Médio</option>
                  <option value="DIFICIL">Difícil</option>
                </select>
              </Field>

              <Field htmlFor="mission-points" label="Pontos">
                <Input
                  id="mission-points"
                  type="number"
                  min={0}
                  max={1000}
                  value={missionForm.points}
                  onChange={(event) => updateMissionField('points', event.target.value)}
                  placeholder="auto"
                />
              </Field>

            </div>

            <Field htmlFor="mission-question" label="Enunciado">
              <textarea
                id="mission-question"
                value={missionForm.question}
                onChange={(event) => updateMissionField('question', event.target.value)}
                placeholder="Escreva o enunciado completo. Você pode usar Markdown e blocos de código."
                rows={8}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </Field>

            <div className="grid gap-4 lg:grid-cols-2">
              {missionForm.options.map((option, index) => (
                <div key={index} className="space-y-3 rounded-md border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Alternativa {String.fromCharCode(65 + index)}
                    </p>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <input
                        type="radio"
                        name="correctIndex"
                        checked={missionForm.correctIndex === index}
                        onChange={() => updateMissionField('correctIndex', index)}
                        className="h-4 w-4"
                      />
                      Correta
                    </label>
                  </div>
                  <Input
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Texto da alternativa ${String.fromCharCode(65 + index)}`}
                    required
                  />
                  <textarea
                    value={missionForm.explanations[index]}
                    onChange={(event) => updateExplanation(index, event.target.value)}
                    placeholder="Explicação desta alternativa"
                    rows={3}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </form>
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
            <QuizDetailSkeleton />
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
