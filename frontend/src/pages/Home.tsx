import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Trophy, 
  Code2, 
  ArrowRight,
  Layout,
  BrainCircuit,
  GraduationCap,
  Cpu,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-200 selection:text-brand-900">
      <Header />

      <main>
        {/* HERO SECTION: Academic & Professional */}
        <section id="home" className="relative pt-32 md:pt-44 lg:pt-48 pb-32 lg:pb-64 overflow-hidden">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 text-center lg:text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-full border border-brand-100 w-fit mx-auto lg:mx-0">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                  </span>
                  <span className="text-xs font-bold tracking-wide uppercase">Plataforma de Apoio ao Ensino</span>
                </div>

                <h1 className="font-display font-bold text-5xl lg:text-7xl leading-[1.1] text-brand-950 tracking-tight">
                  Ensino de programação <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">inteligente e gamificado</span>.
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-serif">
                  AURI é uma ferramenta acadêmica que auxilia professores na gestão de turmas e engaja alunos através de gamificação e desafios de código.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
                  <Button asChild className="h-14 px-8 bg-brand-900 hover:bg-brand-800 text-white rounded-md text-base font-medium shadow-lg hover:shadow-xl transition-all">
                    <Link to="/register">
                      Acessar Plataforma
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Visual Element (Right Side) */}
              <div className="flex-1 relative w-full max-w-xl lg:max-w-none">
                <div className="relative aspect-square md:aspect-[4/3] rounded-2xl bg-brand-900 overflow-hidden shadow-2xl ring-1 ring-slate-900/5">
                  <div className="absolute inset-0 opacity-20" 
                    style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                      backgroundSize: '32px 32px'
                    }}
                  />
                  
                  {/* Abstract Code/IDE Representation */}
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

                    {/* Floating Badge */}
                    <div className="absolute bottom-8 right-8 bg-white p-4 rounded-lg shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce-slow">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-bold uppercase">Conquista Desbloqueada</div>
                        <div className="text-sm font-bold text-slate-900">Primeiro Deploy</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <div className="border-y border-slate-200 bg-white relative z-10">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
              {[
                { label: 'Linguagens Suportadas', value: '5+' },
                { label: 'Correção Automática', value: '100%' },
                { label: 'Ambiente', value: 'Seguro' },
                { label: 'Feedback', value: 'Instantâneo' },
              ].map((stat, i) => (
                <div key={i} className="py-8 text-center px-4">
                  <div className="text-3xl font-bold text-brand-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOR WHOM SECTION (TEACHER VS STUDENT) */}
        <section id="methodology" className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-brand-600 font-bold tracking-wider uppercase text-sm mb-3 block">Público Alvo</span>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-brand-900 mb-6">
                Uma plataforma, <span className="text-brand-600">duas experiências</span>.
              </h2>
              <p className="text-slate-600 text-lg md:text-xl font-serif leading-relaxed">
                Desenvolvemos interfaces especializadas para atender as necessidades específicas de docentes e discentes, criando um ecossistema de aprendizado completo.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              {/* For Teachers */}
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-20 h-20 bg-brand-100 rounded-full blur-2xl opacity-50"></div>
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-xs font-bold uppercase mb-6">
                    <GraduationCap className="h-4 w-4" />
                    Para Docentes
                  </div>
                  <h3 className="font-display text-3xl font-bold text-brand-900 mb-4">
                    Gerencie turmas com eficiência
                  </h3>
                  <ul className="space-y-4 mb-8">
                    {[
                      'Correção automática de exercícios com casos de teste',
                      'Detecção de similaridade de código (anti-plágio)',
                      'Acompanhamento de desempenho em tempo real',
                      'Repositório de questões compartilhadas'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-slate-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* For Students */}
              <div className="relative">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-accent-100 rounded-full blur-2xl opacity-50"></div>
                <div className="bg-brand-900 p-8 rounded-2xl shadow-xl border border-brand-800 relative z-10 text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-800 text-brand-100 rounded-full text-xs font-bold uppercase mb-6">
                    <Users className="h-4 w-4" />
                    Para Discentes
                  </div>
                  <h3 className="font-display text-3xl font-bold text-white mb-4">
                    Aprenda na prática
                  </h3>
                  <ul className="space-y-4 mb-8">
                    {[
                      'Feedback imediato do código submetido',
                      'Ambiente de desenvolvimento integrado (IDE)',
                      'Sistema de níveis e conquistas motivacional',
                      'Histórico de evolução e portfólio'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
                        <span className="text-brand-100">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-24 lg:py-32 bg-white relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
          
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-brand-600 font-bold tracking-wider uppercase text-sm mb-3 block">Funcionalidades</span>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-brand-900 mb-6">
                Tecnologia a serviço da <span className="text-brand-600">Educação</span>.
              </h2>
              <p className="text-slate-600 text-lg md:text-xl font-serif leading-relaxed">
                Ferramentas avançadas de análise de código e gestão de aprendizado integradas em um único ambiente.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Judge0 Integration',
                  desc: 'Compilação e execução de código em ambiente isolado e seguro, suportando múltiplas linguagens e casos de teste.',
                  icon: Cpu
                },
                {
                  title: 'Feedback Automatizado',
                  desc: 'Análise estática e dinâmica do código dos alunos para prover dicas e correções instantâneas.',
                  icon: Code2
                },
                {
                  title: 'Gamificação Estratégica',
                  desc: 'Sistema de pontos, níveis e conquistas projetado para aumentar o engajamento e a motivação intrínseca.',
                  icon: Trophy
                },
                {
                  title: 'Assistente Docente (IA)',
                  desc: 'Inteligência Artificial como ferramenta de apoio ao professor na geração de questões e conteúdos.',
                  icon: BrainCircuit
                },
                {
                  title: 'Dashboards Analíticos',
                  desc: 'Visualização clara do progresso da turma e identificação precoce de alunos com dificuldades.',
                  icon: Layout
                },
                {
                  title: 'Conteúdo Estruturado',
                  desc: 'Organização de material didático em trilhas claras, apoiando metodologias ativas de aprendizagem.',
                  icon: BookOpen
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                  <div className="h-14 w-14 bg-slate-50 rounded-xl flex items-center justify-center mb-6 border border-slate-100 group-hover:border-brand-200 group-hover:bg-brand-50 transition-colors">
                    <feature.icon className="h-7 w-7 text-brand-700 group-hover:text-brand-600 transition-colors" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-brand-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-6 flex-1">
                    {feature.desc}
                  </p>
                  <div className="flex items-center text-brand-700 font-bold text-sm group-hover:text-brand-600">
                    <span className="mr-2">Saiba mais</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 lg:py-32 bg-brand-950 text-white relative overflow-hidden">
          {/* Background Patterns */}
          <div className="absolute inset-0 opacity-[0.03]" 
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-800 to-transparent"></div>
          
          <div className="container mx-auto px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900/50 text-brand-200 rounded-full border border-brand-800 backdrop-blur-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wide uppercase">Junte-se a nós hoje</span>
            </div>
            
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-8 tracking-tight">
              Transforme o ensino de<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-200">programação na sua instituição</span>.
            </h2>
            <p className="text-brand-200/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-serif leading-relaxed">
              Uma plataforma completa, open-source e gratuita, desenvolvida para potencializar o aprendizado de ciência da computação.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="h-16 px-10 bg-white hover:bg-slate-100 text-brand-950 text-lg font-bold rounded-full shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all">
                <Link to="/register">
                  Começar Agora
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 text-white font-display font-bold text-2xl mb-4">
                  <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center">
                    <Code2 className="h-5 w-5 text-white" />
                  </div>
                  AURI
                </div>
                <p className="text-slate-500 max-w-xs mb-6">
                  Plataforma de ensino de programação gamificada e inteligente.
                </p>
                <div className="flex gap-4">
                  {/* Social placeholders */}
                  <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer">
                    <span className="sr-only">GitHub</span>
                    <Code2 className="h-5 w-5" />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-bold mb-6">Plataforma</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="#home" className="hover:text-brand-400 transition-colors">Início</a></li>
                  <li><a href="#methodology" className="hover:text-brand-400 transition-colors">Metodologia</a></li>
                  <li><a href="#features" className="hover:text-brand-400 transition-colors">Funcionalidades</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-bold mb-6">Legal</h4>
                <ul className="space-y-4 text-sm">
                  <li><a href="#" className="hover:text-brand-400 transition-colors">Privacidade</a></li>
                  <li><a href="#" className="hover:text-brand-400 transition-colors">Termos de Uso</a></li>
                  <li><a href="#" className="hover:text-brand-400 transition-colors">Sobre</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-900 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
              <p>&copy; {new Date().getFullYear()} AURI Platform. Open Source Project.</p>
              <p className="mt-2 md:mt-0">Desenvolvido com ❤️ para a educação.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
