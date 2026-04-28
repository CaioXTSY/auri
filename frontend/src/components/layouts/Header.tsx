import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Globe, ChevronDown, LayoutDashboard, User } from 'lucide-react';
import { getAppEntryPath } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainNavItems = [
    { label: 'Funcionalidades', href: '/#features' },
    { label: 'Metodologia', href: '/#methodology' },
    { label: 'Para Professores', href: '/#teachers' },
  ];

  const firstName = user?.name ? user.name.split(' ')[0] : 'Usuário';
  const entryPath = getAppEntryPath(user?.role);
  const topNavItems = isAuthenticated
    ? [
        { label: 'Documentação', href: '/docs' },
        { label: 'Início', href: '/#home' },
      ]
    : [
        { label: 'Documentação', href: '/docs' },
        { label: 'Início', href: '/#home' },
        { label: 'Criar Conta', href: '/register' },
      ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col font-sans">
      {/* Top Bar */}
      <div className="bg-brand-900 text-white py-2 px-6 lg:px-12 hidden md:block border-b border-brand-800">
        <div className="container mx-auto flex justify-between items-center text-xs tracking-wide uppercase font-medium">
          <div className="flex gap-6">
            {topNavItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="hover:text-accent-400 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer hover:text-accent-400 transition-colors">
              <Globe className="h-3 w-3" />
              <span>PT-BR</span>
            </div>
            {isAuthenticated ? (
              <Link to={entryPath} className="flex items-center gap-2 bg-brand-800 px-3 py-1 rounded-sm hover:bg-brand-700 transition-colors font-bold text-accent-400">
                <User className="h-3 w-3" />
                <span>Olá, {firstName}</span>
              </Link>
            ) : (
              <Link to="/login" className="bg-accent-700 text-white px-3 py-1 rounded-sm hover:bg-accent-600 transition-colors font-bold">
                PLATAFORMA
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div
        className={cn(
          "bg-white transition-all duration-300 border-b border-slate-200",
          scrolled ? "py-1 shadow-md" : "py-3"
        )}
      >
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link to="/" className="group">
            <img
              src="/auri_logo.webp"
              alt="AURI"
              className="h-14 w-auto opacity-100 group-hover:opacity-80 transition-opacity [filter:brightness(0)_saturate(100%)_invert(16%)_sepia(28%)_saturate(745%)_hue-rotate(178deg)_brightness(95%)_contrast(94%)]"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {mainNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-semibold text-brand-900 hover:text-accent-700 transition-colors uppercase tracking-wide flex items-center gap-1 group"
              >
                {item.label}
                <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
            {isAuthenticated ? (
              <Link to={entryPath} className="hidden lg:flex items-center gap-2 bg-brand-900 text-white px-4 py-2 rounded-md hover:bg-brand-800 transition-colors font-bold text-xs uppercase tracking-widest">
                <LayoutDashboard className="h-4 w-4" />
                Painel
              </Link>
            ) : (
              <Link to="/register" className="hidden lg:flex items-center gap-2 bg-brand-900 text-white px-4 py-2 rounded-md hover:bg-brand-800 transition-colors font-bold text-xs uppercase tracking-widest">
                Criar Conta
              </Link>
            )}
          </nav>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4">
            {isAuthenticated ? (
              <Link to={entryPath} className="text-xs font-bold text-brand-900 border border-brand-900 px-3 py-1 rounded hover:bg-brand-900 hover:text-white transition-colors">
                PAINEL
              </Link>
            ) : (
              <Link to="/login" className="text-xs font-bold text-brand-900 border border-brand-900 px-3 py-1 rounded hover:bg-brand-900 hover:text-white transition-colors">
                LOGIN
              </Link>
            )}
            <button
              type="button"
              aria-label={isMenuOpen ? 'Fechar menu principal' : 'Abrir menu principal'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-main-menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-brand-900 p-1"
            >
              {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          id="mobile-main-menu"
          role="region"
          aria-label="Menu principal mobile"
          className="fixed inset-0 top-[80px] z-40 overflow-y-auto bg-white pb-20 animate-in slide-in-from-right-10 duration-300 md:hidden"
        >
          <div className="flex flex-col divide-y divide-slate-100">
            <nav aria-label="Links principais" className="flex flex-col">
              {mainNavItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-6 py-4 font-serif text-lg font-bold text-brand-900 transition-colors hover:bg-slate-50 hover:text-accent-700"
                >
                  {item.label}
                  <ChevronDown className="-rotate-90 h-4 w-4 text-slate-400" />
                </a>
              ))}
            </nav>
            <div className="px-6 py-6 bg-slate-50 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Acesso Rápido</p>
              <div className="grid grid-cols-2 gap-3">
                {topNavItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm text-slate-600 hover:text-brand-900 hover:underline"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-200">
                {isAuthenticated ? (
                  <Link
                    to={entryPath}
                    className="w-full flex items-center justify-center gap-2 bg-brand-900 text-white py-3 rounded-md font-bold text-sm uppercase tracking-wider"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Acessar Meu Painel
                  </Link>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/login"
                      className="w-full flex items-center justify-center gap-2 border border-brand-900 text-brand-900 py-3 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-brand-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Fazer Login
                    </Link>
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center gap-2 bg-brand-900 text-white py-3 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-brand-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Criar Conta
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
