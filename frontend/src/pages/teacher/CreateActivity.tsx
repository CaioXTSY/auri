import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService, type Class } from '@/services/class-service';
import { activityService } from '@/services/activity-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Loader2 } from 'lucide-react';

const createActivitySchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  type: z.enum(['EXERCICIO', 'DESAFIO', 'PROJETO', 'QUIZ']),
  difficulty: z.enum(['FACIL', 'MEDIO', 'DIFICIL']),
  points: z.coerce.number().min(1, 'Pontuação mínima é 1'),
  deadline: z.string().min(1, 'Defina um prazo'),
  starterCode: z.string().optional(),
});

type CreateActivityForm = z.infer<typeof createActivitySchema>;

export const CreateActivity = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateActivityForm>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      type: 'EXERCICIO',
      difficulty: 'FACIL',
      points: 100,
      starterCode: '// Digite o código inicial aqui...',
    }
  });

  useEffect(() => {
    const loadClass = async () => {
      if (!classId) return;
      try {
        const data = await classService.getClassDetails(classId);
        setClassData(data);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar dados da turma.');
      } finally {
        setIsLoading(false);
      }
    };
    loadClass();
  }, [classId]);

  const onSubmit = async (data: CreateActivityForm) => {
    if (!classData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await activityService.createActivity({
        ...data,
        disciplineId: classData.disciplineId,
        classId: classData.id,
        deadline: new Date(data.deadline).toISOString(),
        allowLateSubmission: true,
      });
      navigate(`/dashboard/teacher/classes/${classData.id}`);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      // @ts-expect-error - axios error structure
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || errorMessage || 'Erro ao criar atividade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">Turma não encontrada.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(`/dashboard/teacher/classes/${classId}`)}
          className="flex items-center text-slate-500 hover:text-brand-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar para a turma
        </button>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-bold text-brand-900 font-display">Nova Atividade</h1>
            <p className="text-slate-500 text-sm">
              Criando atividade para <span className="font-semibold">{classData.name}</span>
            </p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Exercício de Laços de Repetição" 
                  {...register('title')} 
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    {...register('type')}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900"
                  >
                    <option value="EXERCICIO">Exercício</option>
                    <option value="DESAFIO">Desafio</option>
                    <option value="PROJETO">Projeto</option>
                    <option value="QUIZ">Quiz</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Dificuldade</Label>
                  <select
                    id="difficulty"
                    {...register('difficulty')}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900"
                  >
                    <option value="FACIL">Fácil</option>
                    <option value="MEDIO">Médio</option>
                    <option value="DIFICIL">Difícil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Pontos (XP)</Label>
                  <Input 
                    id="points" 
                    type="number" 
                    {...register('points')} 
                  />
                  {errors.points && <p className="text-xs text-red-500">{errors.points.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Prazo de Entrega</Label>
                  <Input 
                    id="deadline" 
                    type="datetime-local" 
                    {...register('deadline')} 
                  />
                  {errors.deadline && <p className="text-xs text-red-500">{errors.deadline.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Markdown suportado)</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  className="flex min-h-[150px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Descreva o que o aluno deve fazer..."
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="starterCode">Código Inicial (Opcional)</Label>
                <textarea
                  id="starterCode"
                  {...register('starterCode')}
                  className="flex min-h-[150px] w-full rounded-md border border-slate-200 bg-slate-900 text-slate-50 px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900"
                />
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
                      Salvando...
                    </>
                  ) : (
                    'Criar Atividade'
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
