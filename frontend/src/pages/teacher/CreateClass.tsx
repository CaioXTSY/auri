import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService } from '@/services/class-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const createClassSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  semester: z.string().min(1, 'Informe o semestre (ex: 2024.1)'),
  year: z.coerce.number().min(2024, 'Ano invalido'),
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
    },
  });

  const onSubmit = async (data: CreateClassForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await classService.createClass(data);
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
