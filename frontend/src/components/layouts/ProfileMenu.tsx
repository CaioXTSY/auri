import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { getAssetUrl } from '@/lib/assets';
import { getAppEntryPath } from '@/lib/navigation';

interface ProfileMenuProps {
  name: string;
  email?: string;
  role?: string;
  initials: string;
  avatar?: string;
  onLogout: () => void | Promise<void>;
}

const getRoleLabel = (role?: string) => {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'PROFESSOR') return 'Professor';
  return 'Aluno';
};

export const ProfileMenu = ({
  name,
  email,
  role,
  initials,
  avatar,
  onLogout,
}: ProfileMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const avatarSrc = getAssetUrl(avatar);
  const homePath = getAppEntryPath(role as 'ADMIN' | 'PROFESSOR' | 'ALUNO' | null | undefined);

  useEffect(() => {
    if (!open) return;

    const buttonElement = buttonRef.current;
    const focusTarget =
      panelRef.current?.querySelector<HTMLElement>('a,button:not([disabled])') ?? panelRef.current;
    focusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      buttonElement?.focus();
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Abrir menu da conta"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1 pr-3 transition-colors hover:bg-slate-50"
      >
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-900 text-sm font-bold uppercase text-accent-400">
          {avatarSrc ? (
            <img src={avatarSrc} alt={name} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 text-slate-500 transition-transform sm:block ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          ref={panelRef}
          role="menu"
          tabIndex={-1}
          aria-label="Menu da conta"
          className="absolute right-0 z-50 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
        >
          <div className="border-b border-slate-100 px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-900 text-sm font-bold uppercase text-accent-400">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={name} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
                {email ? <p className="truncate text-xs text-slate-500">{email}</p> : null}
                <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">
                  {getRoleLabel(role)}
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <Link
              to={homePath}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <LayoutDashboard className="h-4 w-4 text-slate-500" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/dashboard/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              <span>Configurações</span>
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
