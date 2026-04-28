import { ArrowRight, BookOpen, BrainCircuit, GraduationCap, Sparkles, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Sparkles,
    title: 'Gamificação aplicada',
    description: 'XP, níveis, streaks e conquistas transformam rotina em progresso visível.',
  },
  {
    icon: Users,
    title: 'Turmas organizadas',
    description: 'Professores criam espaços por turma e alunos entram com código simples.',
  },
  {
    icon: BrainCircuit,
    title: 'Quiz diário com IA',
    description: 'Desafios recorrentes ajudam a manter consistência e prática frequente.',
  },
];

const methodology = [
  {
    step: '01',
    title: 'Professor estrutura a turma',
    description: 'Cria o ambiente, publica conteúdo e acompanha adesão.',
  },
  {
    step: '02',
    title: 'Aluno pratica com frequência',
    description: 'Interage com quizzes, postagens e missões para consolidar aprendizado.',
  },
  {
    step: '03',
    title: 'Plataforma devolve feedback',
    description: 'Ranking, progresso e conquistas tornam a evolução legível.',
  },
];

const teacherBenefits = [
  'Gestão de turmas e códigos de acesso',
  'Postagens centralizadas por contexto',
  'Acompanhamento de progresso e engajamento',
  'Base única para rotina de aula e prática',
];

export const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-200 selection:text-brand-900">
      <Header />

      <main>
        <section id="home" className="relative overflow-hidden pb-32 pt-32 md:pt-44 lg:pb-64 lg:pt-48">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex flex-col items-center gap-16 lg:flex-row">
              <div className="flex-1 space-y-8 text-center lg:text-left">
                <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-brand-950 lg:text-7xl">
                  Plataforma para <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">ensino de programação</span>.
                </h1>

                <p className="mx-auto max-w-2xl font-serif text-lg leading-relaxed text-slate-600 lg:mx-0">
                  Organize turmas, publique desafios e acompanhe o progresso dos alunos em um só lugar.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row lg:justify-start">
                  <Button asChild className="h-14 rounded-md bg-brand-900 px-8 text-base font-medium text-white shadow-lg transition-all hover:bg-brand-800 hover:shadow-xl">
                    <Link to="/register">
                      Entrar na plataforma
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-14 px-8 text-base">
                    <Link to="/docs">Ver documentação</Link>
                  </Button>
                </div>
              </div>

              <div className="relative w-full max-w-xl flex-1 lg:max-w-none">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-brand-900 shadow-2xl ring-1 ring-slate-900/5 md:aspect-[4/3]">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                      backgroundSize: '32px 32px',
                    }}
                  />

                  <div className="absolute bottom-0 left-12 right-0 top-12 overflow-hidden rounded-tl-xl bg-slate-50 p-6 shadow-[0_0_50px_rgba(0,0,0,0.2)]">
                    <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                      <div className="ml-4 h-2 w-32 rounded-full bg-slate-100" />
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
                        <span className="pl-4 text-slate-400">// Gamificação aplicada ao ensino</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-slate-300">03</span>
                        <span className="pl-4 text-purple-600">async</span>
                        <span className="text-blue-600">learn</span>
                        <span className="text-slate-600">()</span>
                        <span className="text-slate-800">{'{'}</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-slate-300">04</span>
                        <span className="pl-8 text-slate-800">await</span>
                        <span className="text-brand-700">this</span>
                        <span className="text-slate-600">.</span>
                        <span className="text-blue-600">study</span>
                        <span className="text-slate-600">();</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-slate-300">05</span>
                        <span className="pl-8 text-slate-800">return</span>
                        <span className="text-brand-700">new</span>
                        <span className="text-brand-700">Future</span>
                        <span className="text-slate-600">();</span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-slate-300">06</span>
                        <span className="pl-4 text-slate-800">{'}'}</span>
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

        <section id="features" className="border-y border-slate-200 bg-white py-20">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Funcionalidades</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-brand-900">Uma base única para rotina pedagógica e prática diária</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-900 text-accent-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-brand-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="methodology" className="py-20">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Metodologia</p>
                <h2 className="mt-3 font-display text-3xl font-bold text-brand-900">Aprendizado contínuo, visível e orientado por hábito</h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
                  A AURI combina prática frequente, contexto de turma e feedback gamificado para reduzir abandono e tornar progresso palpável para aluno e professor.
                </p>
              </div>

              <div className="space-y-4">
                {methodology.map((item) => (
                  <article key={item.step} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 font-display text-sm font-bold text-accent-400">
                        {item.step}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-brand-900">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="teachers" className="bg-brand-950 py-20 text-white">
          <div className="container mx-auto grid gap-10 px-6 lg:grid-cols-[1fr_0.9fr] lg:px-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-300">Para Professores</p>
              <h2 className="mt-3 font-display text-3xl font-bold">Menos dispersão operacional, mais clareza sobre engajamento da turma</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-100">
                O painel do professor foi desenhado para concentrar comunicação, gestão de turma e acompanhamento de progresso sem espalhar fluxo em ferramentas paralelas.
              </p>
            </div>

            <div className="rounded-3xl border border-brand-800 bg-brand-900/60 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-600 text-brand-950">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Painel de coordenação</h3>
                  <p className="text-sm text-brand-200">Rotina de aula, turma e prática em um único fluxo.</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-brand-100">
                {teacherBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 text-accent-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full bg-brand-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent-300">
                  <BookOpen className="h-3.5 w-3.5" />
                  Turmas
                </div>
                <div className="flex items-center gap-2 rounded-full bg-brand-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent-300">
                  <Trophy className="h-3.5 w-3.5" />
                  Progresso
                </div>
                <div className="flex items-center gap-2 rounded-full bg-brand-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent-300">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Engajamento
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
