import { type FormEvent, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
  type AdminMissionListItem,
  type GenerateMissionQuizPayload,
} from '@/services/admin-service';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';

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

      const created = await adminService.generateMissionQuiz(payload);
      setMissions((current) => [created, ...current]);
      setGenerationForm(initialGenerationForm);
      setSuccess(`Questão gerada: ${created.title}`);
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setIsGenerating(false);
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

  const filtered = typeFilter ? missions.filter((mission) => mission.type === typeFilter) : missions;

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
                {isGenerating ? 'Gerando...' : 'Gerar missão'}
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
                      <button
                        type="button"
                        onClick={() => setMissionToDelete(mission)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                      >
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}

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
