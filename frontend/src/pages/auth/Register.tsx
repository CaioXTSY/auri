import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User, GraduationCap } from 'lucide-react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth-service';
import { registerSchema } from '@/schemas/auth.schema';
import type { RegisterFormValues } from '@/schemas/auth.schema';

type ApiErrorResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getRegisterErrorMessage = (error: unknown): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const typedError = error as ApiErrorResponse;
    const apiMessage = typedError.response?.data?.message;

    if (typeof apiMessage === 'string') {
      return apiMessage;
    }

    if (Array.isArray(apiMessage)) {
      const firstMessage = (apiMessage as unknown[]).find((item: unknown) => typeof item === 'string');
      if (firstMessage) {
        return firstMessage;
      }
    }
  }
  return 'Erro ao criar conta. Tente novamente.';
};

export const Register = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'ALUNO',
    },
  });

  const role = watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      login(response.user, response.access_token);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      setError(getRegisterErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Inicie sua Jornada" 
      subtitle="Crie sua conta para começar a evoluir suas habilidades."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => setValue('role', 'ALUNO')}
            className={cn(
              "cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all duration-200",
              role === 'ALUNO' 
                ? "border-brand-900 bg-brand-50 text-brand-900" 
                : "border-slate-200 hover:border-brand-200 hover:bg-slate-50 text-slate-500"
            )}
          >
            <User className="h-6 w-6" />
            <span className="text-sm font-bold uppercase tracking-wide">Sou Aluno</span>
          </div>
          <div 
            onClick={() => setValue('role', 'PROFESSOR')}
            className={cn(
              "cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all duration-200",
              role === 'PROFESSOR' 
                ? "border-brand-900 bg-brand-50 text-brand-900" 
                : "border-slate-200 hover:border-brand-200 hover:bg-slate-50 text-slate-500"
            )}
          >
            <GraduationCap className="h-6 w-6" />
            <span className="text-sm font-bold uppercase tracking-wide">Sou Professor</span>
          </div>
        </div>
        {errors.role && (
          <span className="text-xs text-red-500 block text-center">{errors.role.message}</span>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input 
              id="name" 
              placeholder="Ex: João da Silva" 
              className={`h-11 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              {...register('name')}
            />
            {errors.name && (
              <span className="text-xs text-red-500">{errors.name.message}</span>
            )}
          </div>
          
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
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Mínimo 6 caracteres" 
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
          className="w-full h-11 bg-accent-600 hover:bg-accent-700 text-brand-950 font-bold tracking-wide"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              CRIANDO CONTA...
            </>
          ) : (
            "CRIAR MINHA CONTA"
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-slate-500">Já possui cadastro? </span>
        <Link 
          to="/login" 
          className="font-bold text-brand-900 hover:text-accent-700 transition-colors"
        >
          Fazer login
        </Link>
      </div>
    </AuthLayout>
  );
};
