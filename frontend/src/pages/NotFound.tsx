import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="flex min-h-screen items-center justify-center px-6 pt-32 pb-16">
        <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-900 text-accent-400">
            <Compass className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Erro 404</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-brand-900">Página não encontrada</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
            O endereço acessado não existe ou foi movido. Volte para a página inicial ou siga para a documentação da plataforma.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-brand-900 text-white hover:bg-brand-800">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para a home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/docs">Abrir documentação</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};
