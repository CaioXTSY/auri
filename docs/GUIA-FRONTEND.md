# 🎨 Guia Completo de Implementação - Frontend AURI

> **Data de Criação**: 26 de Janeiro de 2026  
> **Status do Backend**: 87% Concluído - 84 endpoints disponíveis  
> **API Base URL**: http://localhost:3001/api/v1

---

## 📋 Sumário

1. [Stack Tecnológica](#-stack-tecnológica)
2. [Setup Inicial](#-setup-inicial)
3. [Estrutura de Pastas](#-estrutura-de-pastas)
4. [Configuração Base](#-configuração-base)
5. [Autenticação](#-autenticação)
6. [Endpoints Disponíveis](#-endpoints-disponíveis)
7. [Módulos por Prioridade](#-módulos-por-prioridade)
8. [Componentes Essenciais](#-componentes-essenciais)
9. [Fluxos de Usuário](#-fluxos-de-usuário)
10. [Gamificação UI](#-gamificação-ui)
11. [Boas Práticas](#-boas-práticas)

---

## 🛠 Stack Tecnológica

### Core
- **React 18+** - Framework JavaScript
- **TypeScript 5+** - Tipagem estática
- **Vite** - Build tool (rápido e moderno)
- **React Router v6** - Roteamento SPA

### UI & Styling
- **shadcn/ui** - Biblioteca de componentes (Radix UI + Tailwind)
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Ícones modernos
- **Framer Motion** - Animações fluidas
- **Recharts** - Gráficos e dashboards

### Estado & Data Fetching
- **Tanstack Query (React Query)** - Server state management
- **Zustand** - Client state management (leve e simples)
- **Axios** - HTTP client

### Formulários & Validação
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Schema validation (TypeScript-first)

### Editor de Código
- **Monaco Editor** ou **CodeMirror** - Editor de código integrado
- **Prism.js** - Syntax highlighting

### Extras
- **date-fns** - Manipulação de datas
- **React Hot Toast** - Notificações elegantes
- **Socket.io-client** - WebSocket para notificações real-time (futuro)

---

## 🚀 Setup Inicial

### 1. Criar Projeto com Vite

```bash
npm create vite@latest auri-frontend -- --template react-ts
cd auri-frontend
npm install
```

### 2. Instalar Dependências Principais

```bash
# UI & Styling
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install class-variance-authority clsx tailwind-merge

# shadcn/ui setup
npx shadcn-ui@latest init

# Routing
npm install react-router-dom

# State & Data
npm install @tanstack/react-query axios zustand

# Formulários
npm install react-hook-form @hookform/resolvers zod

# Ícones & Animações
npm install lucide-react framer-motion

# Gráficos
npm install recharts

# Utilidades
npm install date-fns react-hot-toast

# Editor de Código
npm install @monaco-editor/react
# OU
npm install @uiw/react-codemirror @codemirror/lang-python @codemirror/lang-javascript
```

### 3. Instalar Componentes shadcn

```bash
# Componentes essenciais
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add scroll-area
```

---

## 📁 Estrutura de Pastas

```
auri-frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                    # Configuração Axios & endpoints
│   │   ├── axios.ts
│   │   ├── auth.api.ts
│   │   ├── users.api.ts
│   │   ├── disciplines.api.ts
│   │   ├── classes.api.ts
│   │   ├── activities.api.ts
│   │   ├── submissions.api.ts
│   │   ├── gamification.api.ts
│   │   └── missions.api.ts
│   │
│   ├── components/             # Componentes reutilizáveis
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── code/
│   │   │   ├── CodeEditor.tsx
│   │   │   └── CodePreview.tsx
│   │   ├── gamification/
│   │   │   ├── PointsDisplay.tsx
│   │   │   ├── LevelBadge.tsx
│   │   │   ├── AchievementCard.tsx
│   │   │   └── RankingTable.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── pages/                  # Páginas da aplicação
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── dashboard/
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── TeacherDashboard.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── disciplines/
│   │   │   ├── DisciplinesList.tsx
│   │   │   └── DisciplineDetail.tsx
│   │   ├── classes/
│   │   │   ├── ClassesList.tsx
│   │   │   ├── ClassDetail.tsx
│   │   │   └── MyClasses.tsx
│   │   ├── activities/
│   │   │   ├── ActivitiesList.tsx
│   │   │   ├── ActivityDetail.tsx
│   │   │   └── CreateActivity.tsx
│   │   ├── submissions/
│   │   │   ├── SubmitCode.tsx
│   │   │   └── SubmissionsList.tsx
│   │   ├── gamification/
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── Achievements.tsx
│   │   │   └── MyProgress.tsx
│   │   └── missions/
│   │       ├── MissionsList.tsx
│   │       └── MissionDetail.tsx
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useActivities.ts
│   │   ├── useSubmissions.ts
│   │   └── useGamification.ts
│   │
│   ├── store/                  # Zustand stores
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   │
│   ├── types/                  # TypeScript types
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── activity.types.ts
│   │   └── gamification.types.ts
│   │
│   ├── utils/                  # Funções utilitárias
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   ├── routes/                 # Configuração de rotas
│   │   ├── index.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleRoute.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env
├── .env.example
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## ⚙️ Configuração Base

### 1. Arquivo `.env`

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_NAME=AURI
```

### 2. Configuração do Axios (`src/api/axios.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem('token', data.accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 3. Zustand Store de Autenticação (`src/store/authStore.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.clear();
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 4. React Query Provider (`src/main.tsx`)

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

## 🔐 Autenticação

### Tipos (`src/types/auth.types.ts`)

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'ALUNO' | 'PROFESSOR';
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}
```

### API (`src/api/auth.api.ts`)

```typescript
import api from './axios';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth.types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  logout: () =>
    api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};
```

### Hook (`src/hooks/useAuth.ts`)

```typescript
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const navigate = useNavigate();
  const { setAuth, logout: clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    },
    onError: () => {
      toast.error('Email ou senha incorretos');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    },
    onError: () => {
      toast.error('Erro ao criar conta');
    },
  });

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      navigate('/login');
      toast.success('Logout realizado');
    }
  };

  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoading: loginMutation.isPending || registerMutation.isPending,
  };
};
```

---

## 🌐 Endpoints Disponíveis

### 1. Autenticação (`/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/register` | Registrar novo usuário | ❌ |
| POST | `/auth/login` | Login com email/senha | ❌ |
| POST | `/auth/logout` | Logout do sistema | ✅ |
| POST | `/auth/refresh` | Renovar access token | ❌ |
| POST | `/auth/forgot-password` | Recuperar senha | ❌ |
| POST | `/auth/reset-password` | Resetar senha | ❌ |

### 2. Usuários (`/users`)

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/users` | Listar usuários | Admin, Professor |
| GET | `/users/me` | Perfil atual | Todos |
| GET | `/users/:id` | Buscar por ID | Admin, Professor |
| POST | `/users` | Criar usuário | Admin |
| PATCH | `/users/me` | Atualizar próprio perfil | Todos |
| PATCH | `/users/:id` | Atualizar usuário | Admin |
| DELETE | `/users/:id` | Deletar usuário | Admin |
| POST | `/users/me/avatar` | Upload avatar | Todos |

**Query params**: `page`, `limit`, `role`, `name`, `sortBy`, `sortOrder`

### 3. Disciplinas (`/disciplines`)

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/disciplines` | Listar disciplinas | Todos |
| GET | `/disciplines/:id` | Buscar por ID | Todos |
| POST | `/disciplines` | Criar disciplina | Admin, Professor |
| PATCH | `/disciplines/:id` | Atualizar disciplina | Admin, Professor |
| DELETE | `/disciplines/:id` | Deletar disciplina | Admin, Professor |

**Query params**: `status`, `language`, `createdById`

### 4. Turmas (`/classes`)

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/classes` | Listar turmas | Admin, Professor |
| GET | `/classes/my-classes` | Minhas turmas | Aluno |
| GET | `/classes/:id` | Buscar por ID | Todos |
| GET | `/classes/:id/students` | Listar alunos | Admin, Professor |
| POST | `/classes` | Criar turma | Admin, Professor |
| POST | `/classes/:id/enroll` | Matricular aluno | Admin, Professor |
| PATCH | `/classes/:id` | Atualizar turma | Admin, Professor |
| DELETE | `/classes/:id` | Deletar turma | Admin, Professor |
| DELETE | `/classes/:id/students/:userId` | Remover aluno | Admin, Professor |

**Query params**: `disciplineId`, `name`, `semester`, `year`, `status`, `page`, `limit`

### 5. Atividades (`/activities`)

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/activities` | Listar atividades | Todos |
| GET | `/activities/:id` | Buscar por ID | Todos |
| POST | `/activities` | Criar atividade | Admin, Professor |
| PATCH | `/activities/:id` | Atualizar atividade | Admin, Professor |
| DELETE | `/activities/:id` | Deletar atividade | Admin |
| GET | `/activities/:id/test-cases` | Listar casos de teste | Admin, Professor |
| POST | `/activities/:id/test-cases` | Adicionar caso de teste | Admin, Professor |
| DELETE | `/activities/:id/test-cases/:testId` | Remover caso de teste | Admin, Professor |

**Query params**: `disciplineId`, `classId`, `type`, `difficulty`, `status`, `page`, `limit`

**Tipos de Atividade**: `EXERCICIO`, `QUIZ`, `DESAFIO`, `PROJETO`  
**Dificuldades**: `FACIL`, `MEDIO`, `DIFICIL`

### 6. Submissões (`/submissions`)

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/submissions` | Listar submissões | Todos* |
| GET | `/submissions/:id` | Buscar por ID | Todos* |
| GET | `/submissions/stats` | Minhas estatísticas | Aluno |
| GET | `/submissions/activity/:activityId` | Submissões da atividade | Admin, Professor |
| POST | `/submissions` | Submeter código | Aluno |
| POST | `/submissions/:id/execute` | Executar código | Todos* |
| PATCH | `/submissions/:id` | Atualizar submissão | Admin |
| DELETE | `/submissions/:id` | Deletar submissão | Todos* |

**Query params**: `activityId`, `userId`, `status`, `page`, `limit`  
***Alunos veem apenas suas submissões**

**Status**: `PENDENTE`, `EXECUTANDO`, `APROVADO`, `PARCIAL`, `REPROVADO`, `ERRO`

### 7. Gamificação (`/gamification`)

#### Pontos
| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| POST | `/gamification/points` | Adicionar pontos | Admin |
| GET | `/gamification/points/user/:userId` | Pontos de usuário | Todos |
| GET | `/gamification/points/history/:userId` | Histórico de pontos | Todos |

#### Níveis
| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/gamification/level/:userId` | Nível do usuário | Todos |
| GET | `/gamification/leaderboard` | Top 10 jogadores | Todos |

#### Conquistas
| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/gamification/achievements` | Todas conquistas | Todos |
| GET | `/gamification/achievements/user/:userId` | Conquistas do usuário | Todos |
| POST | `/gamification/achievements` | Criar conquista | Admin |
| POST | `/gamification/achievements/:id/unlock/:userId` | Desbloquear conquista | Admin |

#### Rankings
| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/gamification/rankings/:type` | Ranking por tipo | Todos |
| GET | `/gamification/rankings/:type/:referenceId` | Ranking específico | Todos |
| GET | `/gamification/rankings/user/:userId/position` | Posição do usuário | Todos |
| POST | `/gamification/rankings/update-global` | Atualizar global | Admin |
| POST | `/gamification/rankings/update-class/:classId` | Atualizar turma | Admin |

**Tipos de Ranking**: `GLOBAL`, `DISCIPLINA`, `TURMA`

#### Estatísticas
| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/gamification/stats/user/:userId` | Estatísticas usuário | Todos |
| GET | `/gamification/stats/class/:classId` | Estatísticas turma | Admin, Professor |

### 8. Missões (`/missions`)

| Método | Endpoint | Descrição | Roles |
|--------|----------|-----------|-------|
| GET | `/missions` | Listar todas | Admin, Professor |
| GET | `/missions/available` | Missões disponíveis | Aluno |
| GET | `/missions/my-missions` | Meu histórico | Aluno |
| GET | `/missions/my-stats` | Minhas estatísticas | Aluno |
| GET | `/missions/:id` | Buscar por ID | Todos |
| POST | `/missions` | Criar missão | Admin, Professor |
| POST | `/missions/:id/start` | Iniciar missão | Aluno |
| POST | `/missions/:id/complete` | Completar missão | Aluno |
| PATCH | `/missions/:id` | Atualizar missão | Admin, Professor |
| PATCH | `/missions/:id/progress` | Atualizar progresso | Aluno |
| DELETE | `/missions/:id` | Deletar missão | Admin, Professor |
| GET | `/missions/user/:userId/history` | Histórico usuário | Admin, Professor |
| GET | `/missions/user/:userId/stats` | Stats usuário | Admin, Professor |

**Tipos de Missão**: `DIARIA`, `SEMANAL`, `PERSONALIZADA`  
**Status**: `NAO_INICIADA`, `EM_PROGRESSO`, `CONCLUIDA`, `EXPIRADA`

---

## 🎯 Módulos por Prioridade

### 🔥 Prioridade 1 - MVP (2 semanas)

#### 1. Autenticação & Dashboard
- Login/Registro
- Dashboard básico por role
- Navbar com perfil
- Logout

#### 2. Disciplinas & Turmas
- Listar disciplinas
- Listar turmas (Professor)
- Minhas turmas (Aluno)
- Detalhes da turma

#### 3. Atividades & Submissões
- Listar atividades da turma
- Detalhes da atividade
- Editor de código
- Submeter código
- Ver resultado

### ⚡ Prioridade 2 - Gamificação (1 semana)

#### 4. Sistema de Pontos
- Display de pontos no header
- Badge de nível
- Barra de progresso para próximo nível

#### 5. Conquistas
- Modal de conquista desbloqueada
- Lista de conquistas
- Progresso de cada conquista

#### 6. Rankings
- Tabela de ranking
- Filtros (Global/Turma/Disciplina)
- Posição do usuário destacada

### 🎮 Prioridade 3 - Engajamento (1 semana)

#### 7. Missões
- Lista de missões disponíveis
- Cards de missões ativas
- Progresso visual (0-100%)
- Completar missão

#### 8. Dashboard Avançado
- Gráficos de evolução
- Estatísticas detalhadas
- Calendário de atividades

---

## 🧩 Componentes Essenciais

### 1. Layout Base (`src/components/layout/DashboardLayout.tsx`)

```typescript
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trophy, Target, BookOpen, LogOut } from 'lucide-react';

export function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-primary">AURI</h1>
              
              <div className="hidden md:flex gap-4">
                <Button variant="ghost" onClick={() => navigate('/disciplines')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Disciplinas
                </Button>
                <Button variant="ghost" onClick={() => navigate('/missions')}>
                  <Target className="mr-2 h-4 w-4" />
                  Missões
                </Button>
                <Button variant="ghost" onClick={() => navigate('/leaderboard')}>
                  <Trophy className="mr-2 h-4 w-4" />
                  Ranking
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Points Display */}
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-full">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold text-yellow-700">1,250 pts</span>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name[0]}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/achievements')}>
                    Conquistas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

### 2. Editor de Código (`src/components/code/CodeEditor.tsx`)

```typescript
import Editor from '@monaco-editor/react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, language, onLanguageChange, readOnly }: CodeEditorProps) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Código</h3>
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Linguagem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="cpp">C++</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Editor
        height="500px"
        language={language}
        value={value}
        onChange={(value) => onChange(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          readOnly,
          scrollBeyondLastLine: false,
        }}
      />
    </Card>
  );
}
```

### 3. Card de Conquista (`src/components/gamification/AchievementCard.tsx`)

```typescript
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'COMUM' | 'INCOMUM' | 'RARO' | 'EPICO' | 'LENDARIO';
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
}

const rarityColors = {
  COMUM: 'bg-gray-500',
  INCOMUM: 'bg-green-500',
  RARO: 'bg-blue-500',
  EPICO: 'bg-purple-500',
  LENDARIO: 'bg-yellow-500',
};

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card
      className={cn(
        'p-4 transition-all hover:shadow-lg',
        !achievement.unlocked && 'opacity-50 grayscale'
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn('p-3 rounded-lg', rarityColors[achievement.rarity])}>
          {achievement.unlocked ? (
            <Trophy className="h-6 w-6 text-white" />
          ) : (
            <Lock className="h-6 w-6 text-white" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{achievement.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {achievement.description}
              </p>
            </div>
            <Badge variant="secondary">+{achievement.points}</Badge>
          </div>

          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Desbloqueada em {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### 4. Tabela de Ranking (`src/components/gamification/RankingTable.tsx`)

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankingEntry {
  position: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  points: number;
  level: number;
}

export function RankingTable({ data, currentUserId }: { data: RankingEntry[]; currentUserId: string }) {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="font-semibold">{position}º</span>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Posição</TableHead>
          <TableHead>Jogador</TableHead>
          <TableHead>Nível</TableHead>
          <TableHead className="text-right">Pontos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry) => (
          <TableRow
            key={entry.userId}
            className={cn(
              entry.userId === currentUserId && 'bg-primary/5 font-semibold'
            )}
          >
            <TableCell>{getPositionIcon(entry.position)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.userAvatar} />
                  <AvatarFallback>{entry.userName[0]}</AvatarFallback>
                </Avatar>
                <span>{entry.userName}</span>
                {entry.userId === currentUserId && (
                  <Badge variant="outline" className="ml-2">Você</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge>Nv. {entry.level}</Badge>
            </TableCell>
            <TableCell className="text-right font-semibold">
              {entry.points.toLocaleString()} pts
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 🎨 Fluxos de Usuário

### Aluno

1. **Login** → Dashboard Aluno
2. Ver **Minhas Turmas**
3. Clicar na turma → Ver **Atividades**
4. Clicar em atividade → **Submeter Código**
5. Ver **Resultado** + Pontos ganhos
6. Ver **Conquistas** desbloqueadas
7. Ver **Ranking** da turma

### Professor

1. **Login** → Dashboard Professor
2. Criar **Disciplina**
3. Criar **Turma**
4. **Matricular Alunos**
5. Criar **Atividade** com casos de teste
6. Ver **Submissões** dos alunos
7. Ver **Estatísticas** da turma

### Admin

1. **Login** → Dashboard Admin
2. Gerenciar **Usuários**
3. Criar **Conquistas** personalizadas
4. Criar **Missões** globais
5. Ver **Estatísticas** globais

---

## 🎮 Gamificação UI

### Sistema de Pontos

```typescript
// Display no Header
<div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full text-white">
  <Trophy className="h-4 w-4" />
  <span className="font-bold">1,250</span>
  <span className="text-xs">pts</span>
</div>
```

### Badge de Nível

```typescript
<div className="relative">
  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
    {level}
  </div>
  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg">
    <Sparkles className="h-3 w-3 text-yellow-500" />
  </div>
</div>
```

### Progresso para Próximo Nível

```typescript
import { Progress } from '@/components/ui/progress';

<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Nível {currentLevel}</span>
    <span className="text-muted-foreground">
      {currentXP} / {nextLevelXP} XP
    </span>
  </div>
  <Progress value={(currentXP / nextLevelXP) * 100} />
</div>
```

### Modal de Conquista Desbloqueada

```typescript
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

<Dialog open={showAchievement} onOpenChange={setShowAchievement}>
  <DialogContent className="max-w-md">
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="text-center py-8"
    >
      <div className="mb-4">
        <Trophy className="h-20 w-20 mx-auto text-yellow-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Conquista Desbloqueada!</h2>
      <p className="text-xl font-semibold mb-2">{achievement.title}</p>
      <p className="text-muted-foreground mb-4">{achievement.description}</p>
      <Badge className="text-lg px-4 py-2">+{achievement.points} pontos</Badge>
    </motion.div>
  </DialogContent>
</Dialog>
```

---

## ✅ Boas Práticas

### 1. Gerenciamento de Estado
- Use **React Query** para server state
- Use **Zustand** apenas para client state (UI, auth)
- Evite Redux (overhead desnecessário)

### 2. Performance
- Lazy loading de rotas: `const Dashboard = lazy(() => import('./pages/Dashboard'))`
- Memoização com `useMemo` e `useCallback`
- Virtualização de listas longas (react-window)

### 3. Acessibilidade
- Use componentes shadcn/ui (já acessíveis)
- Labels em todos os inputs
- Alt text em imagens
- Navegação por teclado

### 4. Segurança
- Nunca armazene senhas no state
- Token JWT apenas no localStorage
- Validação client-side com Zod
- Sanitização de inputs

### 5. UX
- Loading states em todas as ações
- Error boundaries
- Toast notifications
- Skeleton loaders
- Confirmação para ações destrutivas

### 6. Responsividade
- Mobile-first approach
- Breakpoints do Tailwind
- Menu hamburger em mobile
- Tabs para navegação em telas pequenas

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint

# Adicionar componente shadcn
npx shadcn-ui@latest add <component-name>

# Gerar tipos do backend (se tiver OpenAPI)
npx openapi-typescript http://localhost:3001/api/v1/docs-json -o src/types/api.types.ts
```

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tanstack Query](https://tanstack.com/query)
- [React Router](https://reactrouter.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)

### Swagger da API
- **URL**: http://localhost:3001/api/v1/docs
- Testando endpoints diretamente
- Ver schemas e exemplos

---

## 🎯 Checklist de Implementação

### Semana 1 - Setup & Auth
- [ ] Criar projeto com Vite
- [ ] Configurar Tailwind + shadcn/ui
- [ ] Configurar Axios + React Query
- [ ] Implementar Login/Registro
- [ ] Criar DashboardLayout
- [ ] Implementar ProtectedRoute
- [ ] Implementar RoleRoute

### Semana 2 - CRUD Básico
- [ ] Listar disciplinas
- [ ] Listar/Ver turmas
- [ ] Listar atividades
- [ ] Detalhes da atividade
- [ ] Editor de código
- [ ] Submeter código
- [ ] Ver resultado

### Semana 3 - Gamificação
- [ ] Display de pontos no header
- [ ] Badge de nível
- [ ] Lista de conquistas
- [ ] Modal de conquista desbloqueada
- [ ] Tabela de ranking
- [ ] Filtros de ranking

### Semana 4 - Missões & Polish
- [ ] Lista de missões
- [ ] Card de missão ativa
- [ ] Barra de progresso
- [ ] Completar missão
- [ ] Animações com Framer Motion
- [ ] Testes E2E básicos

---

**Última atualização**: 26 de Janeiro de 2026  
**Backend Version**: v1.0 (87% completo)  
**Endpoints Disponíveis**: 84

**Pronto para começar! 🚀**
