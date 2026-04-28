import type { ReactNode } from 'react';

interface DashboardHeaderProps {
  userRole?: 'ADMIN' | 'PROFESSOR' | 'ALUNO' | string;
  firstName: string;
  email?: string;
  initials: string;
  userStats?: {
    currentXp: number;
    level: number;
    currentStreak: number;
  } | null;
  notifications: ReactNode;
}

const getRoleLabel = (role?: string) => {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'PROFESSOR') return 'Professor';
  return 'Aluno';
};

const getPanelLabel = (role?: string) => {
  if (role === 'ADMIN') return 'Painel Admin';
  if (role === 'PROFESSOR') return 'Painel do Professor';
  return 'Painel do Aluno';
};

export const DashboardHeader = ({
  userRole,
  firstName,
  email,
  initials,
  userStats,
  notifications,
}: DashboardHeaderProps) => {
  return (
    <header
      className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:h-20 md:px-8"
      data-tour="dashboard-greeting"
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {getPanelLabel(userRole)}
          </span>
          <span className="font-display text-lg font-bold text-brand-900 md:text-xl">
            Olá, {firstName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="hidden flex-col items-end text-xs text-slate-500 sm:flex"
          data-tour={userRole === 'ALUNO' ? 'student-xp' : undefined}
        >
          <span className="font-semibold text-slate-700">{email}</span>
          <span className="uppercase tracking-widest">{getRoleLabel(userRole)}</span>
          {userRole === 'ALUNO' && userStats ? (
            <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              XP {userStats.currentXp} • Nível {userStats.level}
              {userStats.currentStreak > 0 ? (
                <span className="ml-1 font-semibold text-orange-500">
                  🔥 {userStats.currentStreak}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        {notifications}

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-sm font-bold uppercase text-accent-400">
          {initials}
        </div>
      </div>
    </header>
  );
};
