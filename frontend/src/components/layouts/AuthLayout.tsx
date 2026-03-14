import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado Esquerdo - Visual (Desktop) */}
      <div className="hidden lg:flex flex-col relative bg-brand-900 text-white overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/80 to-brand-900/90 pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
            <div className="h-10 w-8 flex items-center justify-center bg-white text-brand-900 rounded-b-full pt-1 pb-2 shadow-sm">
               <span className="font-display font-bold text-xl">A</span>
            </div>
            <span className="font-display font-bold text-2xl tracking-wide">AURI</span>
          </Link>

          <div className="space-y-6 max-w-lg">
            <h2 className="font-display text-4xl font-bold leading-tight">
              Aprenda a programar de forma <span className="text-accent-400 italic font-serif">épica</span>.
            </h2>
            <p className="text-brand-200 text-lg leading-relaxed font-serif">
              "A educação não é o preenchimento de um balde, mas o acendimento de uma chama."
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-brand-900 bg-brand-700 flex items-center justify-center text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-brand-300">
                <span className="text-white font-bold">500+</span> alunos ativos
              </div>
            </div>
          </div>

          <div className="text-xs text-brand-400 font-medium tracking-wider">
            © 2026 AURI EDUCATION PLATFORM
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50 relative">
        <div className="absolute top-6 left-6 lg:hidden">
           <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-brand-900 transition-colors">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Voltar</span>
           </Link>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="font-display text-3xl font-bold text-brand-900">{title}</h1>
            <p className="mt-2 text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
