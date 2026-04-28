import { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Target,
  Trophy,
  Users,
  X,
  Flag,
} from 'lucide-react';

interface SidebarNavProps {
  userRole: string | undefined;
  firstName: string;
  initials: string;
  isActive: (path: string) => string;
  onLogout: () => void | Promise<void>;
  onNavClick: () => void;
  enableTourMarkers?: boolean;
}

const tourAttr = (enabled: boolean | undefined, value: string) =>
  enabled ? { 'data-tour': value } : {};

export const SidebarNav = memo(({
  userRole,
  firstName,
  initials,
  isActive,
  onLogout,
  onNavClick,
  enableTourMarkers,
}: SidebarNavProps) => {
  const marker = (value: string) => tourAttr(enableTourMarkers, value);

  return (
    <>
      <div className="relative flex h-20 items-center justify-center border-b border-brand-900 px-6">
        <Link to="/" onClick={onNavClick}>
          <img src="/auri_logo.webp" alt="AURI" className="h-14 w-auto" />
        </Link>
        <button
          type="button"
          aria-label="Fechar menu lateral"
          className="absolute right-4 rounded-md p-1.5 text-slate-400 hover:text-white md:hidden"
          onClick={onNavClick}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6 text-sm font-medium">
        {userRole === 'ADMIN' ? (
          <>
            <Link to="/admin" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/admin')}`} onClick={onNavClick} {...marker('admin-overview')}>
              <LayoutDashboard className="h-4 w-4" /><span>Visão Geral</span>
            </Link>
            <Link to="/admin/users" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/admin/users')}`} onClick={onNavClick} {...marker('admin-users')}>
              <Users className="h-4 w-4" /><span>Usuários</span>
            </Link>
            <Link to="/admin/classes" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/admin/classes')}`} onClick={onNavClick} {...marker('admin-classes')}>
              <GraduationCap className="h-4 w-4" /><span>Turmas</span>
            </Link>
            <Link to="/admin/missions" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/admin/missions')}`} onClick={onNavClick} {...marker('admin-missions')}>
              <Target className="h-4 w-4" /><span>Missões</span>
            </Link>
            <Link to="/admin/achievements" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/admin/achievements')}`} onClick={onNavClick} {...marker('admin-achievements')}>
              <Trophy className="h-4 w-4" /><span>Conquistas</span>
            </Link>
            <Link to="/admin/ai-generations" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/admin/ai-generations')}`} onClick={onNavClick} {...marker('admin-ai-generations')}>
              <Sparkles className="h-4 w-4" /><span>Gerações IA</span>
            </Link>
            <Link to="/admin/notifications" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/admin/notifications')}`} onClick={onNavClick} {...marker('admin-broadcast')}>
              <Bell className="h-4 w-4" /><span>Broadcast</span>
            </Link>
          </>
        ) : userRole === 'PROFESSOR' ? (
          <>
            <Link to="/dashboard" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/dashboard')}`} onClick={onNavClick} {...marker('professor-overview')}>
              <LayoutDashboard className="h-4 w-4" /><span>Visão Geral</span>
            </Link>
            <Link to="/dashboard/teacher/classes" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/dashboard/teacher/classes')}`} onClick={onNavClick} {...marker('professor-classes')}>
              <BookOpen className="h-4 w-4" /><span>Gerenciar Turmas</span>
            </Link>
            <Link to="/dashboard/posts" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/dashboard/posts')}`} onClick={onNavClick} {...marker('professor-posts')}>
              <MessageSquare className="h-4 w-4" /><span>Postagens</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/dashboard')}`} onClick={onNavClick} {...marker('student-overview')}>
              <LayoutDashboard className="h-4 w-4" /><span>Visão Geral</span>
            </Link>
            <Link to="/dashboard/classes" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/dashboard/classes')}`} onClick={onNavClick} {...marker('student-classes')}>
              <BookOpen className="h-4 w-4" /><span>Minhas Turmas</span>
            </Link>
            <Link to="/dashboard/missions" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/dashboard/missions')}`} onClick={onNavClick} {...marker('student-missions')}>
              <Flag className="h-4 w-4" /><span>Missões</span>
            </Link>
            <Link to="/dashboard/posts" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/dashboard/posts')}`} onClick={onNavClick} {...marker('student-posts')}>
              <MessageSquare className="h-4 w-4" /><span>Postagens</span>
            </Link>
            <Link to="/dashboard/achievements" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/dashboard/achievements')}`} onClick={onNavClick} {...marker('student-achievements')}>
              <Trophy className="h-4 w-4" /><span>Gamificação</span>
            </Link>
          </>
        )}
        <Link to="/dashboard/settings" className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive('/dashboard/settings')}`} onClick={onNavClick} {...marker('settings')}>
          <Settings className="h-4 w-4" /><span>Configurações</span>
        </Link>
      </nav>

      <div className="flex items-center justify-between border-t border-brand-900 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-600 text-sm font-bold uppercase text-brand-950">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{firstName}</span>
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {userRole === 'ADMIN' ? 'Admin' : userRole === 'PROFESSOR' ? 'Professor' : 'Aluno'}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Encerrar sessão"
          onClick={onLogout}
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-brand-900 hover:text-accent-400"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </>
  );
});

SidebarNav.displayName = 'SidebarNav';
