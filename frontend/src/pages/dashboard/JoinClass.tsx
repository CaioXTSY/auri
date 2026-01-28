import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { classService } from '@/services/class-service';

const joinClassSchema = z.object({
  code: z.string().min(1, 'O código da turma é obrigatório'),
});

type JoinClassForm = z.infer<typeof joinClassSchema>;

export const JoinClass = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinClassForm>({
    resolver: zodResolver(joinClassSchema),
  });

  const onSubmit = async (data: JoinClassForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await classService.joinClass(data.code);
      navigate('/dashboard/classes');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      // @ts-expect-error - axios error structure
      const serverMessage = err.response?.data?.message;
      
      if (serverMessage === 'Turma não encontrada') {
        setError('Código de turma inválido. Verifique e tente novamente.');
      } else if (serverMessage === 'Você já está matriculado nesta turma') {
        setError('Você já faz parte desta turma.');
      } else {
        setError(serverMessage || errorMessage || 'Erro ao entrar na turma.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6 pt-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/classes')}
            className="text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-brand-900 font-display">
            Entrar em uma Turma
          </h1>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎓</span>
            </div>
            <p className="text-slate-600">
              Peça o código da turma ao seu professor e digite-o abaixo para entrar.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Código da Turma</Label>
              <Input
                id="code"
                placeholder="Ex: ckz123456"
                {...register('code')}
                className={`text-center font-mono text-lg tracking-wider ${errors.code ? 'border-red-500' : ''}`}
                autoComplete="off"
                autoCapitalize="none"
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/classes')}
                disabled={isSubmitting}
                className="w-full"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar na Turma'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
