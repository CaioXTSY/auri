import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    // TODO: Implementar integração com API
    console.log('Login submit');
  };

  return (
    <AuthLayout 
      title="Bem-vindo de volta" 
      subtitle="Entre com suas credenciais para acessar sua jornada."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
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
              required 
              className="h-11"
            />
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
