# AURI Frontend

Frontend da plataforma gamificada de ensino de programação AURI.

## 🚀 Tecnologias

- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de interface
- **React Router v7** - Roteamento
- **Zustand** - Gerenciamento de estado
- **TanStack Query** - Gerenciamento de estado assíncrono (server state)
- **React Hook Form + Zod** - Formulários e validação
- **Monaco Editor** - Editor de código (instalado, pendente de uso)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente (se houver)
# cp .env.example .env
```

## 🏃 Executar

```bash
# Desenvolvimento (http://localhost:5173)
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📁 Estrutura

```
src/
├── components/
│   ├── layouts/     # Layouts de página (Dashboard, Auth, ProtectedRoute)
│   ├── gamification/# Componentes de pontos, conquistas, ranking
│   ├── quiz/        # Componentes de quiz/missão
│   └── ui/          # Componentes base (shadcn/ui)
├── lib/             # Configuração do Axios (com interceptors JWT)
├── pages/
│   ├── auth/        # Login, Register
│   ├── dashboard/   # Área do Aluno (Home, Turmas, Missões, Conquistas, Posts)
│   └── teacher/     # Área do Professor (Turmas, Criar Turma)
├── schemas/         # Schemas Zod de validação
├── services/        # Integração com API Backend
├── stores/          # Zustand (auth store)
└── types/           # Definições de tipos TypeScript
```

## 🔑 Funcionalidades Principais

### Aluno
- **Dashboard**: Visão geral de pontos, nível, conquistas e ranking.
- **Turmas**: Visualização e ingresso em turmas por código.
- **Missões**: Histórico e quiz diário gerado por IA.
- **Conquistas**: Badges desbloqueados por critério.
- **Posts**: Fórum de discussão por turma.

### Professor
- **Turmas**: Criação e gestão de turmas, visualização de alunos.

### Não implementado
- Atividades de programação e editor de código
- Submissões e correção automatizada
