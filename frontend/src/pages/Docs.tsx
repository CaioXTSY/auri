import { Header } from '@/components/layouts/Header';

export const Docs = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="pt-32 md:pt-40 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-3xl font-display font-bold text-brand-900">Documentação</h1>
          <p className="mt-3 text-slate-600">
            Esta seção está em construção. Em breve você verá guias, APIs e exemplos completos.
          </p>
        </div>
      </main>
    </div>
  );
};
