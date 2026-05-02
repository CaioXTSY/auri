import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService, type UpdateClassSettingsPayload } from '@/services/class-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const createClassSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  semester: z.string().min(1, 'Informe o semestre (ex: 2024.1)'),
  year: z.coerce.number().min(2024, 'Ano invalido'),
  allowStudentPosts: z.boolean(),
  allowStudentReplies: z.boolean(),
  requirePostApproval: z.boolean(),
  requireReplyApproval: z.boolean(),
  allowJoinByCode: z.boolean(),
  requireJoinApproval: z.boolean(),
  lockEnrollment: z.boolean(),
  activitiesEnabled: z.boolean(),
  allowLateSubmissions: z.boolean(),
  showRankingToStudents: z.boolean(),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

export const CreateClass = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClassForm>({
    resolver: zodResolver(createClassSchema) as never,
    defaultValues: {
      year: new Date().getFullYear(),
      semester: `${new Date().getFullYear()}.${new Date().getMonth() < 6 ? '1' : '2'}`,
      allowStudentPosts: true,
      allowStudentReplies: true,
      requirePostApproval: false,
      requireReplyApproval: false,
      allowJoinByCode: true,
      requireJoinApproval: false,
      lockEnrollment: false,
      activitiesEnabled: false,
      allowLateSubmissions: false,
      showRankingToStudents: true,
    },
  });

  const onSubmit = async (data: CreateClassForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { name, semester, year, ...settings } = data;
      await classService.createClass({
        name,
        semester,
        year,
        settings,
      });
      navigate('/dashboard/teacher/classes');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      const serverMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(serverMessage || errorMessage || 'Erro ao criar turma. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-500 transition-colors hover:text-brand-900"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar para turmas
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h1
              className="font-display text-xl font-bold text-brand-900"
              data-tour="create-class-header"
            >
              Nova Turma
            </h1>
            <p className="text-sm text-slate-500">Preencha os dados para criar uma nova turma.</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
              <div className="space-y-2" data-tour="create-class-name">
                <Label htmlFor="name">Nome da Turma</Label>
                <Input id="name" placeholder="Ex: Turma A - Manha" {...register('name')} />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4" data-tour="create-class-period">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semestre</Label>
                  <Input id="semester" placeholder="Ex: 2024.1" {...register('semester')} />
                  {errors.semester && (
                    <p className="text-xs text-red-500">{errors.semester.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input id="year" type="number" {...register('year')} />
                  {errors.year && (
                    <p className="text-xs text-red-500">{errors.year.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-brand-900">Configurações iniciais</h2>
                  <p className="mt-1 text-sm text-slate-500">Esses ajustes podem ser alterados depois na turma.</p>
                </div>

                <CreateSettingsGroup
                  title="Participação"
                  items={[
                    ['allowStudentPosts', 'Alunos podem criar postagens'],
                    ['allowStudentReplies', 'Alunos podem responder postagens'],
                    ['requirePostApproval', 'Professor precisa aprovar novas postagens'],
                    ['requireReplyApproval', 'Professor precisa aprovar respostas'],
                  ]}
                  register={register}
                />

                <CreateSettingsGroup
                  title="Matrícula"
                  items={[
                    ['allowJoinByCode', 'Permitir entrada por código'],
                    ['requireJoinApproval', 'Exigir aprovação do professor para entrar'],
                    ['lockEnrollment', 'Bloquear novas matrículas'],
                  ]}
                  register={register}
                />

                <CreateSettingsGroup
                  title="Atividades"
                  items={[
                    ['activitiesEnabled', 'Habilitar atividades nesta turma'],
                    ['allowLateSubmissions', 'Permitir entrega atrasada'],
                    ['showRankingToStudents', 'Mostrar ranking da turma para alunos'],
                  ]}
                  register={register}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-brand-900 hover:bg-brand-800"
                  disabled={isSubmitting}
                  data-tour="create-class-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Turma'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

type CreateSettingKey = keyof UpdateClassSettingsPayload;

const CreateSettingsGroup = ({
  title,
  items,
  register,
}: {
  title: string;
  items: [CreateSettingKey, string][];
  register: ReturnType<typeof useForm<CreateClassForm>>['register'];
}) => (
  <div className="rounded-lg border border-slate-200 bg-white">
    <div className="border-b border-slate-100 px-4 py-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
    <div className="divide-y divide-slate-100">
      {items.map(([key, label]) => (
        <label key={key} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-900 accent-brand-900 focus:ring-brand-900"
            {...register(key)}
          />
        </label>
      ))}
    </div>
  </div>
);
