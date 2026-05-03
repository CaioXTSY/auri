import { useState, useEffect } from 'react';
import { Header } from '@/components/layouts/Header';
import {
  BookOpen, Zap, Shield, Users, GraduationCap, Flag,
  Trophy, Code, ExternalLink, Menu, X,
  ChevronRight, Bell, Hash,
  Settings, UserCog,
} from 'lucide-react';

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001')
  .replace(/\/api\/v\d+\/?$/, '')
  .replace(/\/+$/, '');
const API_URL = `${API_ORIGIN}/api/v1`;
const SOCKET_URL = API_ORIGIN;
const SWAGGER_URL = `${API_URL}/docs`;

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
  items: { id: string; label: string }[];
}

const nav: NavSection[] = [
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    icon: BookOpen,
    items: [
      { id: 'o-que-e', label: 'O que é a AURI' },
      { id: 'como-funciona', label: 'Como funciona' },
    ],
  },
  {
    id: 'primeiros-passos',
    label: 'Primeiros Passos',
    icon: Zap,
    items: [
      { id: 'criar-conta', label: 'Criando sua conta' },
      { id: 'papeis', label: 'Perfis: Aluno e Professor' },
    ],
  },
  {
    id: 'autenticacao',
    label: 'Autenticação',
    icon: Shield,
    items: [
      { id: 'jwt', label: 'Tokens JWT' },
      { id: 'endpoints-auth', label: 'Endpoints' },
    ],
  },
  {
    id: 'alunos',
    label: 'Para Alunos',
    icon: Users,
    items: [
      { id: 'dashboard-aluno', label: 'Dashboard' },
      { id: 'entrar-turma', label: 'Entrar em uma turma' },
      { id: 'missoes-aluno', label: 'Missões diárias' },
    ],
  },
  {
    id: 'professores',
    label: 'Para Professores',
    icon: GraduationCap,
    items: [
      { id: 'criar-turma', label: 'Criando uma turma' },
      { id: 'gerenciar-turma', label: 'Gerenciando alunos' },
    ],
  },
  {
    id: 'turmas',
    label: 'Turmas',
    icon: Hash,
    items: [
      { id: 'codigo-turma', label: 'Código de acesso' },
      { id: 'postagens', label: 'Postagens da turma' },
      { id: 'configuracoes-turma', label: 'Configurações e matrícula' },
    ],
  },
  {
    id: 'atividades',
    label: 'Atividades',
    icon: Code,
    items: [
      { id: 'status-atividades', label: 'Status atual' },
      { id: 'submissoes-codigo', label: 'Submissões de código' },
    ],
  },
  {
    id: 'missoes',
    label: 'Missões',
    icon: Flag,
    items: [
      { id: 'quiz-diario', label: 'Quiz diário' },
      { id: 'historico', label: 'Histórico de missões' },
    ],
  },
  {
    id: 'gamificacao',
    label: 'Gamificação',
    icon: Trophy,
    items: [
      { id: 'xp-nivel', label: 'XP e Níveis' },
      { id: 'streak', label: 'Sequências (Streak)' },
      { id: 'conquistas', label: 'Conquistas' },
      { id: 'ranking', label: 'Ranking' },
    ],
  },
  {
    id: 'notificacoes',
    label: 'Notificações',
    icon: Bell,
    items: [{ id: 'realtime', label: 'Tempo real (WebSocket)' }],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: UserCog,
    items: [
      { id: 'painel-admin', label: 'Painel administrativo' },
      { id: 'endpoints-admin', label: 'Endpoints admin' },
    ],
  },
  {
    id: 'api',
    label: 'Referência da API',
    icon: Code,
    items: [
      { id: 'swagger', label: 'Swagger / OpenAPI' },
      { id: 'base-url', label: 'Base URL' },
    ],
  },
];

const Badge = ({ method }: { method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' }) => {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-amber-100 text-amber-700',
    PATCH: 'bg-orange-100 text-orange-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase tracking-wide ${colors[method]}`}>
      {method}
    </span>
  );
};

const Endpoint = ({ method, path, description }: { method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; description: string }) => (
  <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
    <Badge method={method} />
    <code className="text-sm text-brand-900 font-mono flex-1">{path}</code>
    <span className="text-xs text-slate-500 hidden sm:block">{description}</span>
  </div>
);

const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => (
  <div className="relative rounded-lg overflow-hidden border border-slate-200 my-4">
    <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{language}</span>
    </div>
    <pre className="bg-slate-900 text-slate-100 text-sm font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre">
      {code}
    </pre>
  </div>
);

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-24 mb-16">
    <h2 className="font-display font-bold text-2xl text-brand-900 mb-6 pb-3 border-b border-slate-200">
      {title}
    </h2>
    {children}
  </section>
);

const SubSection = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <div id={id} className="scroll-mt-24 mb-10">
    <h3 className="font-display font-bold text-lg text-brand-800 mb-3">{title}</h3>
    {children}
  </div>
);

const Callout = ({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    tip: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };
  const icons = { info: 'ℹ️', warning: '⚠️', tip: '💡' };
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-sm font-sans my-4 ${styles[type]}`}>
      <span className="text-base leading-snug">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
};

export const Docs = () => {
  const [activeSection, setActiveSection] = useState('visao-geral');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const sectionId = nav.find((s) =>
              s.items.some((i) => i.id === entry.target.id),
            )?.id ?? entry.target.id;
            setActiveSection(sectionId);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );

    const allIds = nav.flatMap((s) => [s.id, ...s.items.map((i) => i.id)]);
    for (const id of allIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header />

      <div className="pt-[112px] md:pt-[136px] flex max-w-[1400px] mx-auto">
        {/* Mobile sidebar toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="fixed bottom-6 right-6 z-50 lg:hidden bg-brand-900 text-white p-3 rounded-full shadow-xl"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar flutuante */}
        <aside
          className={`
            fixed z-50 inset-y-0 left-0 w-72 overflow-y-auto
            transform transition-transform duration-300 pt-[112px] md:pt-[136px] pb-6 px-3
            lg:sticky lg:top-[136px] lg:h-[calc(100vh-136px)] lg:translate-x-0 lg:pt-4 lg:flex-shrink-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 px-3 py-4 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-3 mb-2">
              Documentação
            </p>
            <nav className="space-y-0.5">
              {nav.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <div key={section.id}>
                    <button
                      type="button"
                      onClick={() => scrollTo(section.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all text-left ${
                        isActive
                          ? 'bg-brand-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-brand-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {section.label}
                    </button>
                    {isActive && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {section.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollTo(item.id)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-brand-900 hover:bg-slate-50 transition-colors text-left"
                          >
                            <ChevronRight className="h-3 w-3 flex-shrink-0" />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="mt-3 mx-1 p-3 rounded-xl bg-brand-900 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-accent-400 mb-1">API Reference</p>
              <p className="text-xs text-brand-300 mb-2 leading-relaxed">
                Explore os endpoints no Swagger.
              </p>
              <a
                href={SWAGGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-400 hover:text-accent-300 transition-colors"
              >
                Abrir Swagger
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 lg:px-16 py-12 lg:py-16 max-w-4xl">

          {/* ── Visão Geral ── */}
          <Section id="visao-geral" title="Visão Geral">
            <SubSection id="o-que-e" title="O que é a AURI">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Somos uma plataforma de ensino de programação gamificada, criada para tornar o aprendizado
                mais engajante e eficaz. Professores criam turmas e acompanham o progresso dos alunos,
                enquanto alunos acumulam XP, sobem de nível, mantêm sequências diárias e desbloqueiam conquistas.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                {[
                  { icon: '🎓', title: 'Educacional', desc: 'Focada no ensino de programação com metodologia ativa.' },
                  { icon: '🎮', title: 'Gamificada', desc: 'XP, níveis, streaks, conquistas e rankings motivam a continuidade.' },
                  { icon: '⚡', title: 'IA integrada', desc: 'Quizzes diários gerados por inteligência artificial.' },
                ].map((c) => (
                  <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-5">
                    <span className="text-2xl">{c.icon}</span>
                    <p className="mt-2 font-sans font-semibold text-brand-900">{c.title}</p>
                    <p className="mt-1 font-serif text-sm text-slate-500 leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection id="como-funciona" title="Como funciona">
              <ol className="space-y-4 mt-2">
                {[
                  { step: '01', title: 'Professor cria uma turma', desc: 'Um código único é gerado para que alunos possam ingressar.' },
                  { step: '02', title: 'Aluno entra na turma', desc: 'Com o código da turma, o aluno se associa e começa a participar.' },
                  { step: '03', title: 'Missões e quizzes diários', desc: 'Todo dia, a IA gera perguntas de programação para os alunos responderem.' },
                  { step: '04', title: 'Acúmulo de XP e progressão', desc: 'Respostas corretas geram XP, sobem o nível e alimentam a sequência diária.' },
                  { step: '05', title: 'Conquistas e ranking', desc: 'Marcos são recompensados com conquistas e visibilidade no ranking.' },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4 items-start">
                    <span className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-900 text-accent-400 font-display font-bold text-sm flex items-center justify-center">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-sans font-semibold text-slate-800">{item.title}</p>
                      <p className="font-serif text-sm text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </SubSection>
          </Section>

          {/* ── Primeiros Passos ── */}
          <Section id="primeiros-passos" title="Primeiros Passos">
            <SubSection id="criar-conta" title="Criando sua conta">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Acesse a plataforma e clique em <strong>Criar Conta</strong>. Preencha seu nome, e-mail e senha.
                Após o cadastro, você será redirecionado automaticamente para o painel.
              </p>
              <Callout type="tip">
                Use um e-mail institucional para facilitar a identificação pelo professor da turma.
              </Callout>
              <CodeBlock
                language="curl"
                code={`curl -X POST ${API_URL}/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "João Silva",
    "email": "joao@escola.edu.br",
    "password": "senhaSegura123",
    "role": "ALUNO"
  }'`}
              />
            </SubSection>

            <SubSection id="papeis" title="Perfis: Aluno e Professor">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Ao criar a conta, você escolhe entre dois perfis com experiências distintas:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-brand-600" />
                    <span className="font-sans font-semibold text-brand-900">Aluno</span>
                  </div>
                  <ul className="font-sans text-sm text-slate-600 space-y-1.5">
                    {['Entra em turmas por código', 'Responde quizzes diários', 'Acumula XP e sobe de nível', 'Acompanha ranking e conquistas', 'Visualiza postagens da turma'].map((i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>{i}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-5 w-5 text-brand-600" />
                    <span className="font-sans font-semibold text-brand-900">Professor</span>
                  </div>
                  <ul className="font-sans text-sm text-slate-600 space-y-1.5">
                    {['Cria e gerencia turmas', 'Visualiza progresso dos alunos', 'Acessa ranking da turma', 'Publica postagens', 'Acompanha missões completadas'].map((i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>{i}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </SubSection>
          </Section>

          {/* ── Autenticação ── */}
          <Section id="autenticacao" title="Autenticação">
            <SubSection id="jwt" title="Tokens JWT">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Utilizamos <strong>JWT (JSON Web Token)</strong> para autenticação. Após o login,
                você recebe um <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-brand-800">access_token</code> para enviar no header <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-brand-800">Authorization</code>. O refresh token fica em cookie HttpOnly.
              </p>
              <CodeBlock
                language="http"
                code={`Authorization: Bearer <seu_token_jwt>`}
              />
              <Callout type="warning">
                Quando o access token expirar, renove a sessão com <code className="bg-slate-100 px-1 rounded text-xs">POST /auth/refresh</code>. O navegador envia o cookie automaticamente.
              </Callout>
            </SubSection>

            <SubSection id="endpoints-auth" title="Endpoints de autenticação">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="POST" path="/auth/register" description="Criar nova conta" />
                <Endpoint method="POST" path="/auth/login" description="Fazer login e obter token" />
                <Endpoint method="POST" path="/auth/refresh" description="Renovar access token pelo cookie" />
                <Endpoint method="POST" path="/auth/forgot-password" description="Enviar link de recuperação" />
                <Endpoint method="POST" path="/auth/reset-password" description="Redefinir senha com token" />
                <Endpoint method="POST" path="/auth/logout" description="Encerrar sessão" />
                <Endpoint method="GET" path="/users/me" description="Dados do usuário autenticado" />
              </div>
              <CodeBlock
                language="curl"
                code={`curl -X POST ${API_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "joao@escola.edu.br",
    "password": "senhaSegura123"
  }'

# Resposta
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx...",
    "name": "João Silva",
    "email": "joao@escola.edu.br",
    "role": "ALUNO"
  }
}`}
              />
              <CodeBlock
                language="curl"
                code={`# Solicitar reset de senha
curl -X POST ${API_URL}/auth/forgot-password \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "joao@escola.edu.br" }'

# Redefinir senha
curl -X POST ${API_URL}/auth/reset-password \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "token-recebido-por-email",
    "newPassword": "novaSenhaSegura123"
  }'`}
              />
            </SubSection>
          </Section>

          {/* ── Alunos ── */}
          <Section id="alunos" title="Para Alunos">
            <SubSection id="dashboard-aluno" title="Dashboard do Aluno">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                O painel principal exibe um resumo completo da sua jornada: nível atual, XP acumulado,
                progresso para o próximo nível, sequência diária, conquistas recentes, posição no ranking e missões.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="GET" path="/dashboard/student" description="Dados completos do painel do aluno" />
              </div>
            </SubSection>

            <SubSection id="entrar-turma" title="Entrar em uma turma">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Para entrar em uma turma, solicite o <strong>código de acesso</strong> ao seu professor.
                No dashboard, acesse <em>Minhas Turmas → Entrar em turma</em> e insira o código.
              </p>
              <CodeBlock
                language="curl"
                code={`curl -X POST ${API_URL}/classes/join \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{ "code": "ABC123" }'`}
              />
            </SubSection>

            <SubSection id="missoes-aluno" title="Missões diárias">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Todo dia a plataforma gera automaticamente um quiz de programação personalizado.
                Responder corretamente concede XP e mantém sua sequência ativa.
              </p>
              <Callout type="tip">
                Para manter a sequência diária, responda corretamente o quiz do dia.
              </Callout>
            </SubSection>
          </Section>

          {/* ── Professores ── */}
          <Section id="professores" title="Para Professores">
            <SubSection id="criar-turma" title="Criando uma turma">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                No painel do professor, acesse <em>Gerenciar Turmas → Nova Turma</em>. Informe o nome
                da turma e configure as opções desejadas. Um código único será gerado automaticamente
                para compartilhar com os alunos.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="POST" path="/classes" description="Criar nova turma" />
                <Endpoint method="GET" path="/classes/my-created-classes" description="Listar turmas do professor" />
                <Endpoint method="GET" path="/classes/:id" description="Detalhes de uma turma" />
                <Endpoint method="PATCH" path="/classes/:id" description="Atualizar turma" />
              </div>
            </SubSection>

            <SubSection id="gerenciar-turma" title="Gerenciando alunos">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Na página da turma, você visualiza alunos matriculados, mural, configurações,
                solicitações de entrada e ranking da turma. O acompanhamento detalhado por atividades
                ainda depende do módulo de atividades.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="GET" path="/classes/:id/students" description="Alunos da turma" />
                <Endpoint method="DELETE" path="/classes/:id/students/:userId" description="Remover aluno" />
                <Endpoint method="GET" path="/gamification/ranking?type=TURMA&referenceId=:id" description="Ranking da turma" />
              </div>
            </SubSection>
          </Section>

          {/* ── Turmas ── */}
          <Section id="turmas" title="Turmas">
            <SubSection id="codigo-turma" title="Código de acesso">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Cada turma possui um código único gerado automaticamente. Este código pode ser
                compartilhado com os alunos quando a entrada por código estiver habilitada.
              </p>
              <Callout type="info">
                Professores podem exigir aprovação para entrada, bloquear novas matrículas ou desativar
                a entrada por código nas configurações da turma.
              </Callout>
            </SubSection>

            <SubSection id="postagens" title="Postagens da turma">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Alunos, professores e admins podem publicar e responder no mural da turma. A permissão
                de postagem dos alunos e a moderação dependem das configurações da turma.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="GET" path="/posts" description="Listar postagens (por turma)" />
                <Endpoint method="POST" path="/posts" description="Criar postagem" />
                <Endpoint method="POST" path="/posts/:id/replies" description="Responder postagem" />
                <Endpoint method="PATCH" path="/posts/:id/approve" description="Aprovar postagem pendente" />
                <Endpoint method="PATCH" path="/posts/:id/reject" description="Rejeitar postagem pendente" />
                <Endpoint method="DELETE" path="/posts/:id" description="Excluir postagem" />
              </div>
            </SubSection>

            <SubSection id="configuracoes-turma" title="Configurações e matrícula">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Professores e admins controlam como a turma aceita alunos, se alunos podem postar,
                se posts/respostas precisam de aprovação e se o ranking fica visível para alunos.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="GET" path="/classes/:id/settings" description="Buscar configurações da turma" />
                <Endpoint method="PATCH" path="/classes/:id/settings" description="Atualizar configurações" />
                <Endpoint method="GET" path="/classes/:id/join-requests" description="Solicitações pendentes" />
                <Endpoint method="POST" path="/classes/:id/join-requests/:requestId/approve" description="Aprovar entrada" />
                <Endpoint method="POST" path="/classes/:id/join-requests/:requestId/reject" description="Rejeitar entrada" />
              </div>
            </SubSection>
          </Section>

          {/* ── Atividades ── */}
          <Section id="atividades" title="Atividades">
            <SubSection id="status-atividades" title="Status atual">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                A interface de turma já reserva uma aba para atividades, mas o módulo de atividades
                de programação ainda não está implementado no backend. Hoje a plataforma cobre turmas,
                mural, missões, quiz diário, gamificação, notificações e administração.
              </p>
              <Callout type="warning">
                Atividades de programação ainda são escopo futuro: não existem endpoints, modelos Prisma
                nem telas completas para criar exercícios corrigíveis.
              </Callout>
            </SubSection>

            <SubSection id="submissoes-codigo" title="Submissões de código">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Submissões de código, execução de testes, correção automática e histórico de tentativas
                ainda não estão disponíveis neste MVP.
              </p>
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
                <div className="flex items-start gap-3">
                  <Settings className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-sans font-semibold text-brand-900">Planejado para evolução</p>
                    <p className="mt-1 font-serif text-sm leading-relaxed text-slate-500">
                      Quando implementado, este módulo deve incluir criação de atividades, editor de código,
                      submissões, resultados de testes e painel de acompanhamento do professor.
                    </p>
                  </div>
                </div>
              </div>
            </SubSection>
          </Section>

          {/* ── Missões ── */}
          <Section id="missoes" title="Missões">
            <SubSection id="quiz-diario" title="Quiz diário">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Um quiz de múltipla escolha é gerado por IA todos os dias para a plataforma. As perguntas
                são focadas em programação e variam por dificuldade.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="GET" path="/missions/daily-quiz" description="Quiz do dia atual" />
                <Endpoint method="GET" path="/missions/daily-quiz/me" description="Quiz do dia com sua tentativa" />
                <Endpoint method="POST" path="/missions/:id/quiz/answer" description="Responder quiz" />
              </div>
              <CodeBlock
                language="curl"
                code={`# Buscar o quiz do dia
curl -X GET ${API_URL}/missions/daily-quiz/me \\
  -H "Authorization: Bearer <token>"

# Responder
curl -X POST ${API_URL}/missions/:id/quiz/answer \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{ "selectedIndex": 1 }'`}
              />
            </SubSection>

            <SubSection id="historico" title="Histórico de missões">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Todas as missões respondidas ficam registradas e podem ser consultadas no histórico.
                O sistema calcula automaticamente a taxa de acerto e o total de XP acumulado por missões.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="GET" path="/missions/available" description="Missões disponíveis para o aluno" />
                <Endpoint method="GET" path="/missions/my-missions" description="Histórico paginado do aluno" />
                <Endpoint method="GET" path="/missions/my-stats" description="Estatísticas de missões do aluno" />
              </div>
            </SubSection>
          </Section>

          {/* ── Gamificação ── */}
          <Section id="gamificacao" title="Gamificação">
            <SubSection id="xp-nivel" title="XP e Níveis">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                XP é concedido por missões concluídas, conquistas desbloqueadas e bônus de sequência.
                Ao acumular XP suficiente, o aluno avança de nível.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 my-4">
                {[
                  { action: 'Quiz diário correto', xp: '40-140 XP' },
                  { action: 'Conquista desbloqueada', xp: 'variável' },
                  { action: 'Missão personalizada', xp: 'definido pelo professor' },
                  { action: 'Bônus de sequência', xp: 'marcos específicos' },
                ].map((r) => (
                  <div key={r.action} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3">
                    <span className="font-sans text-sm text-slate-600">{r.action}</span>
                    <span className="text-sm font-bold text-accent-600">{r.xp}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-4">
                <Endpoint method="GET" path="/gamification/stats/me" description="XP, nível e progresso" />
              </div>
            </SubSection>

            <SubSection id="streak" title="Sequências (Streak)">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                O <strong>streak</strong> mede quantos dias consecutivos o aluno participou da plataforma.
                Ao atingir marcos específicos, bônus e reconhecimentos são concedidos.
              </p>
              <div className="flex flex-wrap gap-2 my-4">
                {[3, 7, 14, 30, 100].map((days) => (
                  <div key={days} className="flex items-center gap-1.5 bg-brand-900 text-accent-400 rounded-full px-3 py-1.5 text-sm font-bold">
                    🔥 {days} dias
                  </div>
                ))}
              </div>
              <Callout type="warning">
                O streak é zerado se o aluno ficar mais de 1 dia sem acessar a plataforma. Mantenha o hábito diário!
              </Callout>
            </SubSection>

            <SubSection id="conquistas" title="Conquistas">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Conquistas são desbloqueadas automaticamente ao cumprir critérios pré-definidos,
                como atingir um nível, manter uma sequência ou completar missões. Cada conquista
                concede XP adicional.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="GET" path="/gamification/achievements/me" description="Minhas conquistas e status" />
              </div>
            </SubSection>

            <SubSection id="ranking" title="Ranking">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Há dois rankings: <strong>global</strong> (todos os alunos da plataforma) e
                <strong> por turma</strong>. A posição é calculada com base no total de XP acumulado.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="GET" path="/gamification/ranking?type=GLOBAL" description="Ranking global" />
                <Endpoint method="GET" path="/gamification/ranking?type=TURMA&referenceId=:id" description="Ranking da turma" />
              </div>
            </SubSection>
          </Section>

          {/* ── Notificações ── */}
          <Section id="notificacoes" title="Notificações">
            <SubSection id="realtime" title="Tempo real (WebSocket)">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Utilizamos <strong>Socket.IO</strong> para entrega de notificações em tempo real.
                Quando um evento relevante ocorre (nova conquista, atualização de ranking, aviso do professor),
                você é notificado instantaneamente sem precisar recarregar a página.
              </p>
              <CodeBlock
                language="javascript"
                code={`import { io } from 'socket.io-client';

const socket = io('${SOCKET_URL}', {
  auth: {
    token: jwtToken,
  },
});

socket.on('notification', (payload) => {
  console.log('Nova notificação:', payload);
  // { id, title, message, read, createdAt }
});`}
              />
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-4">
                <Endpoint method="GET" path="/notifications" description="Listar notificações (paginado)" />
                <Endpoint method="GET" path="/notifications/unread" description="Total não lidas" />
                <Endpoint method="PATCH" path="/notifications/:id/read" description="Marcar como lida" />
                <Endpoint method="PATCH" path="/notifications/read-all" description="Marcar todas como lidas" />
              </div>
            </SubSection>
          </Section>

          {/* ── Admin ── */}
          <Section id="admin" title="Admin">
            <SubSection id="painel-admin" title="Painel administrativo">
              <p className="font-serif text-slate-600 leading-relaxed mb-4">
                Usuários com papel <strong>ADMIN</strong> acessam uma área dedicada para acompanhar
                métricas da plataforma, gerenciar usuários, turmas, missões, conquistas, notificações
                e auditar gerações de IA.
              </p>
              <Callout type="info">
                As rotas administrativas do frontend ficam em <code className="bg-slate-100 px-1 rounded text-xs">/admin</code> e são protegidas por papel.
              </Callout>
            </SubSection>

            <SubSection id="endpoints-admin" title="Endpoints admin">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <Endpoint method="GET" path="/admin/stats" description="Visão geral da plataforma" />
                <Endpoint method="GET" path="/admin/stats/timeseries" description="Séries dos últimos 30 dias" />
                <Endpoint method="GET" path="/admin/stats/top" description="Top turmas e conquistas" />
                <Endpoint method="GET" path="/admin/ai-generations" description="Listar gerações de IA" />
                <Endpoint method="GET" path="/admin/ai-generations/:id" description="Detalhe de geração de IA" />
                <Endpoint method="GET" path="/admin/achievements" description="Listar conquistas" />
                <Endpoint method="POST" path="/admin/achievements" description="Criar conquista" />
                <Endpoint method="PATCH" path="/admin/achievements/:id" description="Atualizar conquista" />
                <Endpoint method="DELETE" path="/admin/achievements/:id" description="Remover conquista" />
                <Endpoint method="POST" path="/admin/notifications/broadcast" description="Enviar notificação em massa" />
              </div>
            </SubSection>
          </Section>

          {/* ── API Reference ── */}
          <Section id="api" title="Referência da API">
            <SubSection id="swagger" title="Swagger / OpenAPI">
              <p className="text-slate-600 leading-relaxed mb-6">
                Nossa API é documentada com <strong>Swagger (OpenAPI 3.0)</strong>.
                Você pode explorar os endpoints, testar requisições e ver os schemas de resposta
                diretamente pelo navegador.
              </p>
              <a
                href={SWAGGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-brand-900 hover:bg-brand-800 text-white px-6 py-4 rounded-xl font-semibold transition-colors group"
              >
                <Code className="h-5 w-5 text-accent-400" />
                <div className="text-left">
                  <p className="text-sm font-bold">Abrir Swagger UI</p>
                  <p className="text-xs text-brand-300 font-normal">{SWAGGER_URL}</p>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto text-brand-400 group-hover:text-accent-400 transition-colors" />
              </a>
            </SubSection>

            <SubSection id="base-url" title="Base URL e convenções">
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Base URL</p>
                  <code className="text-sm font-mono text-brand-900 bg-slate-50 px-3 py-2 rounded-lg block">
                    {API_URL}
                  </code>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Convenções</p>
                  <ul className="font-sans text-sm text-slate-600 space-y-2">
                    <li className="flex gap-2"><span className="text-brand-600 font-mono font-semibold">JSON</span>Todas as requisições e respostas usam <code className="bg-slate-100 px-1 rounded text-xs">application/json</code>.</li>
                    <li className="flex gap-2"><span className="text-brand-600 font-mono font-semibold">Auth</span>Endpoints protegidos exigem <code className="bg-slate-100 px-1 rounded text-xs">Authorization: Bearer token</code>.</li>
                    <li className="flex gap-2"><span className="text-brand-600 font-mono font-semibold">Cookie</span>O refresh token fica em cookie HttpOnly e é enviado automaticamente em <code className="bg-slate-100 px-1 rounded text-xs">/auth/refresh</code>.</li>
                    <li className="flex gap-2"><span className="text-brand-600 font-mono font-semibold">Erros</span>Respostas de erro seguem o padrão <code className="bg-slate-100 px-1 rounded text-xs">{'{ "message": "..." }'}</code>.</li>
                    <li className="flex gap-2"><span className="text-brand-600 font-mono font-semibold">Paginação</span>Listas paginadas aceitam <code className="bg-slate-100 px-1 rounded text-xs">?page=1&limit=10</code>.</li>
                  </ul>
                </div>
              </div>
            </SubSection>
          </Section>
        </main>
      </div>
    </div>
  );
};
