import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth-service';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/schemas/auth.schema';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [succeeded, setSucceeded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <AuthLayout title="Link inválido" subtitle="Este link de recuperação não é válido.">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-sm text-slate-600">
            O link pode ter expirado ou já foi utilizado. Solicite um novo link de recuperação.
          </p>
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-900 hover:text-accent-700 transition-colors">
            Solicitar novo link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (succeeded) {
    return (
      <AuthLayout title="Senha redefinida!" subtitle="Sua senha foi alterada com sucesso.">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="text-sm text-slate-600">
            Você já pode entrar com sua nova senha.
          </p>
          <Button
            className="bg-brand-900 hover:bg-brand-800 text-white font-bold"
            onClick={() => navigate('/login')}
          >
            Ir para o login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, data.newPassword);
      setSucceeded(true);
    } catch {
      setError('Não foi possível redefinir a senha. O link pode ter expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Escolha uma nova senha para sua conta."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div role="alert" className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={errors.newPassword ? 'reset-new-password-error' : undefined}
              className={`h-11 ${errors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <span id="reset-new-password-error" role="alert" className="text-xs text-red-500">{errors.newPassword.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'reset-confirm-password-error' : undefined}
              className={`h-11 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <span id="reset-confirm-password-error" role="alert" className="text-xs text-red-500">{errors.confirmPassword.message}</span>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-brand-900 hover:bg-brand-800 text-white font-bold tracking-wide"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
              SALVANDO...
            </>
          ) : (
            'REDEFINIR SENHA'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};
