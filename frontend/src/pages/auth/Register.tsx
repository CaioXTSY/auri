import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'ALUNO' | 'PROFESSOR'>('ALUNO');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    // TODO: Implementar integração com API
    console.log('Register submit', { role });
  };

  return (
    <AuthLayout 
      title="Inicie sua Jornada" 
      subtitle="Crie sua conta para começar a evoluir suas habilidades."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => setRole('ALUNO')}
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
            onClick={() => setRole('PROFESSOR')}
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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input 
              id="name" 
              placeholder="Ex: João da Silva" 
              required 
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Acadêmico</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="aluno@universidade.edu" 
              required 
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Mínimo 6 caracteres" 
              required 
              minLength={6}
              className="h-11"
            />
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
