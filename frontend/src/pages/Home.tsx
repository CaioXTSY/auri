import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-200 selection:text-brand-900">
      <Header />

      <main>
        <section id="home" className="relative pt-32 md:pt-44 lg:pt-48 pb-32 lg:pb-64 overflow-hidden">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 text-center lg:text-left space-y-8">
                <h1 className="font-display font-bold text-5xl lg:text-7xl leading-[1.1] text-brand-950 tracking-tight">
                  Plataforma para <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">ensino de programação</span>.
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-serif">
                  Organize turmas, publique desafios e acompanhe o progresso dos alunos em um só lugar.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
                  <Button asChild className="h-14 px-8 bg-brand-900 hover:bg-brand-800 text-white rounded-md text-base font-medium shadow-lg hover:shadow-xl transition-all">
                    <Link to="/register">
                      Entrar na plataforma
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex-1 relative w-full max-w-xl lg:max-w-none">
                <div className="relative aspect-square md:aspect-[4/3] rounded-2xl bg-brand-900 overflow-hidden shadow-2xl ring-1 ring-slate-900/5">
                  <div className="absolute inset-0 opacity-20" 
                    style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                      backgroundSize: '32px 32px'
                    }}
                  />

                  <div className="absolute top-12 left-12 right-0 bottom-0 bg-slate-50 rounded-tl-xl shadow-[0_0_50px_rgba(0,0,0,0.2)] p-6 overflow-hidden">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                      <div className="ml-4 h-2 w-32 bg-slate-100 rounded-full" />
                    </div>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex gap-4">
                        <span className="text-slate-300">01</span>
                        <span className="text-purple-600">class</span>
                        <span className="text-brand-700">Student</span>
                        <span className="text-slate-600">implements</span>
                        <span className="text-brand-700">Developer</span>
                        <span className="text-slate-800">{'{'}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-slate-300">02</span>
                        <span className="text-slate-400 pl-4">// Gamificação aplicada ao ensino</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-slate-300">03</span>
                        <span className="text-purple-600 pl-4">async</span>
                        <span className="text-blue-600">learn</span>
                        <span className="text-slate-600">()</span>
                        <span className="text-slate-800">{'{'}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-slate-300">04</span>
                        <span className="text-slate-800 pl-8">await</span>
                        <span className="text-brand-700">this</span>
                        <span className="text-slate-600">.</span>
                        <span className="text-blue-600">study</span>
                        <span className="text-slate-600">();</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-slate-300">05</span>
                        <span className="text-slate-800 pl-8">return</span>
                        <span className="text-brand-700">new</span>
                        <span className="text-brand-700">Future</span>
                        <span className="text-slate-600">();</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-slate-300">06</span>
                        <span className="text-slate-800 pl-4">{'}'}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-slate-300">07</span>
                        <span className="text-slate-800">{'}'}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
