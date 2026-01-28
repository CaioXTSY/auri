# AURI Frontend

Frontend da plataforma gamificada de ensino de programação AURI.

## 🚀 Tecnologias

- **React 18+** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de interface
- **React Router v6** - Roteamento
- **Zustand** - Gerenciamento de estado
- **React Query** - Gerenciamento de estado assíncrono (server state)
- **Monaco Editor** - Editor de código (mesmo do VS Code)
- **React Hook Form + Zod** - Formulários e validação

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
├── assets/          # Imagens e recursos estáticos
├── components/      # Componentes React reutilizáveis
│   ├── layouts/     # Layouts de página (Dashboard, Auth)
│   └── ui/          # Componentes base (shadcn/ui)
├── hooks/           # Custom hooks
├── lib/             # Utilitários e configurações (axios, utils)
├── pages/           # Páginas da aplicação
│   ├── auth/        # Login, Register
│   ├── dashboard/   # Área do Aluno (Home, Classes, Activities)
│   └── teacher/     # Área do Professor (Management, Submissions)
├── services/        # Integração com API Backend
└── types/           # Definições de tipos TypeScript
```

## 🔑 Funcionalidades Principais

### Aluno
- **Dashboard**: Visão geral de progresso e próximas atividades.
- **Turmas**: Visualização e matrícula em turmas.
- **Activity Workspace**: Ambiente de resolução de exercícios com editor de código e feedback em tempo real.

### Professor
- **Gestão**: Criação e edição de Disciplinas, Turmas e Atividades.
- **Editor de Atividades**: Interface para criar exercícios e casos de teste.
- **Submissões**: Visualização detalhada de código dos alunos e resultados dos testes.
