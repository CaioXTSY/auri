import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Clock3, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { classService, type PendingClassJoinRequest } from '@/services/class-service';

const joinClassSchema = z.object({
  code: z.string().min(1, 'O código da turma é obrigatório'),
});

type JoinClassForm = z.infer<typeof joinClassSchema>;

export const JoinClass = () => {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingClassJoinRequest[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PendingClassJoinRequest | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JoinClassForm>({
    resolver: zodResolver(joinClassSchema),
  });

  const code = watch('code')?.trim().toLowerCase();
  const pendingRequestForCode = useMemo(
    () => pendingRequests.find((request) => request.class.code.toLowerCase() === code),
    [code, pendingRequests],
  );

  useEffect(() => {
    classService.getMyJoinRequests()
      .then(setPendingRequests)
      .catch(() => {
        // A consulta não impede o aluno de tentar entrar em outra turma.
      });
  }, []);

  const onSubmit = async (data: JoinClassForm) => {
    if (pendingRequestForCode) {
      setPendingRequest(pendingRequestForCode);
      setError(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await classService.joinClass(data.code);
      if (result.status === 'PENDING_APPROVAL') {
        const request = result.request;
        if (request) {
          setPendingRequest(request);
          setPendingRequests((current) => [
            request,
            ...current.filter((item) => item.classId !== request.classId),
          ]);
        }
        notify({
          title: `Solicitação enviada para "${result.class.name}"`,
          description: 'Aguarde a aprovação do professor para entrar na turma.',
          variant: 'success',
        });
        return;
      } else {
        notify({
          title: `Você entrou na turma "${result.class.name}"`,
          description: 'As atividades publicadas já estão disponíveis para você.',
          variant: 'success',
        });
      }
      navigate('/dashboard/classes', { state: { joinedClass: result.class } });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      const serverMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;

      if (serverMessage === 'Turma não encontrada' || serverMessage === 'Turma nao encontrada') {
        setError('Código de turma inválido. Verifique e tente novamente.');
      } else if (serverMessage?.includes('encerrada')) {
        setError('Esta turma está encerrada e não aceita novas matrículas.');
      } else if (serverMessage?.includes('bloqueadas')) {
        setError('As matrículas nesta turma estão bloqueadas no momento.');
      } else if (serverMessage?.includes('desativada')) {
        setError('A entrada por código não está disponível nesta turma.');
      } else if (
        serverMessage === 'Você já está matriculado nesta turma' ||
        serverMessage === 'Voce ja esta matriculado nesta turma'
      ) {
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
      <div className="mx-auto max-w-md space-y-6 pt-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/classes')}
            className="text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1
            className="font-display text-2xl font-bold text-brand-900"
            data-tour="join-class-header"
          >
            Entrar em uma Turma
          </h1>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <span className="text-2xl">T</span>
            </div>
            <p className="text-slate-600">
              Peça o código da turma ao seu professor e digite abaixo para entrar.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Código da Turma</Label>
              <Input
                id="code"
                placeholder="Ex: ckz123456"
                aria-invalid={Boolean(errors.code)}
                aria-describedby={errors.code ? 'join-class-code-error' : undefined}
                {...register('code')}
                data-tour="join-class-code"
                className={`text-center font-mono text-lg tracking-wider ${errors.code ? 'border-red-500' : ''}`}
                autoComplete="off"
                autoCapitalize="none"
              />
              {errors.code && (
                <p id="join-class-code-error" role="alert" className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            {pendingRequest && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status" aria-live="polite">
                <div className="flex items-start gap-3">
                  <Clock3 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
                  <div>
                    <p className="font-semibold">Aguardando aprovação do professor</p>
                    <p className="mt-1">
                      Solicitação enviada para <strong>{pendingRequest.class.name}</strong>. Aguarde a aprovação do professor.
                    </p>
                    {pendingRequest.class.createdBy?.name && (
                      <p className="mt-1 text-xs text-amber-900">
                        Professor(a): {pendingRequest.class.createdBy.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                disabled={isSubmitting || Boolean(pendingRequestForCode)}
                data-tour="join-class-submit"
                className="w-full bg-brand-900 text-white hover:bg-brand-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
                    Enviando solicitação...
                  </>
                ) : pendingRequestForCode ? (
                  'Solicitação pendente'
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
