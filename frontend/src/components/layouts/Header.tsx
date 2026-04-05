import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search, Globe, ChevronDown, LayoutDashboard, User } from 'lucide-react';
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

  const topNavItems = [
    { label: 'Documentação', href: '/docs' },
    { label: 'Suporte', href: '/suporte' },
    { label: 'Blog', href: '/blog' },
  ];

  const mainNavItems = [
    { label: 'Funcionalidades', href: '/#features' },
    { label: 'Metodologia', href: '/#methodology' },
    { label: 'Para Professores', href: '/#methodology' },
  ];

  const firstName = user?.name ? user.name.split(' ')[0] : 'Usuário';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col font-sans">
      {/* Top Bar - Utilitária (Estilo Universitário) */}
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
              <Link to="/dashboard" className="flex items-center gap-2 bg-brand-800 px-3 py-1 rounded-sm hover:bg-brand-700 transition-colors font-bold text-accent-400">
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
          scrolled ? "py-2 shadow-md" : "py-6"
        )}
      >
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link to="/" className="group">
            <img src="/auri_logo.webp" alt="AURI" className="h-14 w-auto opacity-100 group-hover:opacity-80 transition-opacity" />
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
            <button className="text-brand-900 hover:text-accent-700 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            
            {/* Mobile/Tablet Auth Button (if TopBar is hidden or just extra redundancy) */}
            {isAuthenticated ? (
               <Link to="/dashboard" className="hidden lg:flex items-center gap-2 bg-brand-900 text-white px-4 py-2 rounded-md hover:bg-brand-800 transition-colors font-bold text-xs uppercase tracking-widest">
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
              <Link to="/dashboard" className="text-xs font-bold text-brand-900 border border-brand-900 px-3 py-1 rounded hover:bg-brand-900 hover:text-white transition-colors">
                PAINEL
              </Link>
            ) : (
              <Link to="/login" className="text-xs font-bold text-brand-900 border border-brand-900 px-3 py-1 rounded hover:bg-brand-900 hover:text-white transition-colors">
                LOGIN
              </Link>
            )}
            <button
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
        <div className="fixed inset-0 top-[80px] z-40 bg-white overflow-y-auto md:hidden pb-20 animate-in slide-in-from-right-10 duration-300">
          <div className="flex flex-col divide-y divide-slate-100">
            {mainNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="px-6 py-4 text-brand-900 font-serif font-bold text-lg hover:bg-slate-50 hover:text-accent-700 transition-colors flex justify-between items-center"
              >
                {item.label}
                <ChevronDown className="-rotate-90 h-4 w-4 text-slate-400" />
              </a>
            ))}

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
                    to="/dashboard" 
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
