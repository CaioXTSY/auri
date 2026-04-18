import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth-service';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/auth.schema';

export const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(data.email);
      setSubmitted(true);
    } catch {
      setError('Não foi possível enviar o e-mail. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Verifique seu e-mail" subtitle="Instruções de recuperação enviadas.">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="text-sm text-slate-600">
            Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha nos próximos minutos.
          </p>
          <Link to="/login" className="text-sm font-semibold text-brand-900 hover:text-accent-700 transition-colors">
            ← Voltar para o login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe seu e-mail e enviaremos um link de redefinição."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            className={`h-11 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('email')}
          />
          {errors.email && (
            <span className="text-xs text-red-500">{errors.email.message}</span>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-brand-900 hover:bg-brand-800 text-white font-bold tracking-wide"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ENVIANDO...
            </>
          ) : (
            'ENVIAR LINK DE RECUPERAÇÃO'
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o login
        </Link>
      </div>
    </AuthLayout>
  );
};
