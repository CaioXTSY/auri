import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService } from '@/services/class-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Loader2 } from 'lucide-react';

const createClassSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  semester: z.string().min(1, 'Informe o semestre (ex: 2024.1)'),
  year: z.coerce.number().min(2024, 'Ano inválido'),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

export const CreateClass = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateClassForm>({
    resolver: zodResolver(createClassSchema) as never,
    defaultValues: {
      year: new Date().getFullYear(),
      semester: `${new Date().getFullYear()}.${new Date().getMonth() < 6 ? '1' : '2'}`,
    }
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
      // @ts-expect-error - axios error structure
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || errorMessage || 'Erro ao criar turma. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 hover:text-brand-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar para turmas
        </button>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-bold text-brand-900 font-display">Nova Turma</h1>
            <p className="text-slate-500 text-sm">Preencha os dados para criar uma nova turma.</p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Turma</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Turma A - Manhã" 
                  {...register('name')} 
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semestre</Label>
                  <Input 
                    id="semester" 
                    placeholder="Ex: 2024.1" 
                    {...register('semester')} 
                  />
                  {errors.semester && (
                    <p className="text-xs text-red-500">{errors.semester.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input 
                    id="year" 
                    type="number" 
                    {...register('year')} 
                  />
                  {errors.year && (
                    <p className="text-xs text-red-500">{errors.year.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
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
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
