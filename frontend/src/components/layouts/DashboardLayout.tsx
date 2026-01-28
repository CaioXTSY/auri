import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Trophy, CalendarDays, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  const firstName = user?.name ? user.name.split(' ')[0] : 'Aluno';
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'AU';

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'bg-brand-900 text-accent-400'
      : 'text-slate-200 hover:bg-brand-900/80 hover:text-white transition-colors';
  };

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <aside className="hidden md:flex md:flex-col w-64 bg-brand-950 text-slate-100 border-r border-brand-900">
        <div className="h-20 px-6 flex items-center border-b border-brand-900">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-11 w-9 flex items-center justify-center bg-accent-600 text-brand-950 rounded-b-full shadow-sm">
              <span className="font-display font-bold text-xl">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl tracking-wide">AURI</span>
              <span className="font-serif text-[10px] italic text-slate-400 tracking-widest">
                PLATAFORMA
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 text-sm font-medium">
          {user?.role === 'PROFESSOR' ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard')}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Visão Geral</span>
              </Link>
              <Link
                to="/dashboard/teacher/classes"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/teacher/classes')}`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Gerenciar Turmas</span>
              </Link>
              <Link
                to="/dashboard/teacher/disciplines"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/teacher/disciplines')}`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Disciplinas</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard')}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Visão Geral</span>
              </Link>
              <Link
                to="/dashboard/classes"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/classes')}`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Minhas Turmas</span>
              </Link>
            </>
          )}

          <button
            type="button"
          >
            
          </button>
          <Link
            to="/dashboard/achievements"
            className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive('/dashboard/achievements')}`}
          >
            <Trophy className="h-4 w-4" />
            <span>Gamificação</span>
          </Link>

          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-200 hover:bg-brand-900/80 hover:text-white transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Atividades</span>
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-200 hover:bg-brand-900/80 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-brand-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent-600 text-brand-950 flex items-center justify-center text-sm font-bold uppercase">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{firstName}</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wide">
                {user?.role === 'PROFESSOR' ? 'Professor' : 'Aluno'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-md text-slate-400 hover:text-accent-400 hover:bg-brand-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between bg-white border-b border-slate-200">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              {user?.role === 'PROFESSOR' ? 'Painel do Professor' : 'Painel do Aluno'}
            </span>
            <span className="text-lg md:text-xl font-display font-bold text-brand-900">
              Olá, {firstName}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{user?.email}</span>
              <span className="uppercase tracking-widest">
                {user?.role === 'PROFESSOR' ? 'Professor' : 'Aluno'}
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-brand-900 text-accent-400 flex items-center justify-center text-sm font-bold uppercase">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

