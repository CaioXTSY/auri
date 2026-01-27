import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight } from 'lucide-react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth-service';
import { loginSchema } from '@/schemas/auth.schema';
import type { LoginFormValues } from '@/schemas/auth.schema';

export const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      login(response.user, response.token);
      navigate('/dashboard'); // Redirecionar para dashboard após login
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Bem-vindo de volta" 
      subtitle="Entre com suas credenciais para acessar sua jornada."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Acadêmico</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="aluno@universidade.edu" 
              className={`h-11 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register('email')}
            />
            {errors.email && (
              <span className="text-xs text-red-500">{errors.email.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link 
                to="/forgot-password" 
                className="text-xs font-medium text-accent-700 hover:text-accent-800 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              className={`h-11 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register('password')}
            />
             {errors.password && (
              <span className="text-xs text-red-500">{errors.password.message}</span>
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ENTRANDO...
            </>
          ) : (
            <>
              ACESSAR PLATAFORMA
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 px-2 text-slate-500 font-medium tracking-wider">
            Ou
          </span>
        </div>
      </div>

      <div className="text-center text-sm">
        <span className="text-slate-500">Ainda não tem uma conta? </span>
        <Link 
          to="/register" 
          className="font-bold text-brand-900 hover:text-accent-700 transition-colors"
        >
          Matricule-se agora
        </Link>
      </div>
    </AuthLayout>
  );
};
