import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';

export const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header />

      <main>
        {/* Hero Section Acadêmico */}
        <section className="relative pt-48 pb-32 lg:pt-64 lg:pb-48 bg-brand-900 text-white overflow-hidden">
          {/* Background Overlay Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/80 to-brand-900/90 pointer-events-none" />

          <div className="container relative z-10 mx-auto px-6 lg:px-12 text-center">

            <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl tracking-tight mb-8 text-white leading-[0.9]">
              Plataforma de <br/>
              <span className="text-accent-400 italic font-serif">Ensino Gamificado</span>
            </h1>

            <p className="font-serif text-lg md:text-2xl text-brand-100 max-w-3xl mx-auto leading-relaxed mb-12">
              A AURI integra gestão acadêmica, gamificação avançada e IA assistiva para transformar o ensino de programação em uma experiência engajadora.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button className="w-full sm:w-auto bg-accent-600 hover:bg-accent-700 text-brand-950 font-bold px-10 h-14 text-lg rounded-sm uppercase tracking-wide">
                Criar Conta Grátis
              </Button>
              <Button variant="outline" className="w-full sm:w-auto border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium px-10 h-14 text-lg rounded-sm uppercase tracking-wide backdrop-blur-sm">
                Agendar Demonstração
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
