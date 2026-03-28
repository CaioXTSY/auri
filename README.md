# AURI — Docs

## 1. Visão Geral

O **AURI** é uma plataforma web gamificada para apoio ao ensino de programação, com perfis de **Aluno**, **Professor** e **Admin**.

A solução é dividida em:

- **Backend** em NestJS com Prisma e MySQL
- **Frontend** em React + TypeScript + Vite
- **Atividades práticas** de programação
- **Recursos de IA** para geração de quiz/missões

Objetivos centrais da plataforma:

- Gestão acadêmica de turmas e atividades
- Criação e acompanhamento de atividades
- Submissão e correção automatizada de código
- Camada de gamificação com pontos, níveis, ranking e conquistas
- Missões diárias/semanais para engajamento contínuo

---

## 2. Estrutura do Repositório

```text
auri/
├── backend/          # API NestJS + Prisma + MySQL
├── frontend/         # SPA React + Vite + TypeScript
└── docs/             # Documentação detalhada (arquitetura, endpoints, status)
```

---

## 3. Stack Tecnológica

### Backend

- Node.js + TypeScript
- NestJS
- Prisma ORM
- MySQL
- JWT (auth e refresh token)
- Swagger (OpenAPI)
- Socket.io (notificações em tempo real)
- @nestjs/schedule (CRON jobs)
- Axios/fetch para integrações externas

### Frontend

- React
- TypeScript (modo estrito)
- Vite
- React Router
- Zustand
- React Query
- React Hook Form + Zod
- Tailwind CSS
- shadcn/ui e Radix primitives
- Monaco Editor

### Testes

- Backend: Jest (unitários e e2e)
- Frontend: Playwright (e2e)

---

## 4. Arquitetura de Alto Nível

### Camadas Backend

1. **Controller**: recebe requests HTTP, aplica guards e validações.
2. **Service**: regras de negócio.
3. **PrismaService**: acesso a banco.
4. **DTOs + class-validator**: validação de payload.
5. **Guards de Auth/Roles**: autorização por perfil.

### Camadas Frontend

1. **Pages**: telas por contexto (auth, aluno, professor).
2. **Services**: integração com API.
3. **Store (Zustand)**: estado de autenticação.
4. **Components reutilizáveis**: layout, UI e gamificação.

---

## 5. Banco de Dados (Resumo do Domínio)

Entidades implementadas:

- **User**: autenticação e perfil
- **Class** e **ClassStudent**: turmas e matrículas
- **UserPoint**, **Achievement**, **UserAchievement**, **Ranking**: gamificação
- **Mission**, **MissionQuiz**, **MissionQuizAttempt**, **UserMission**: missões
- **AIGeneration**: histórico de conteúdo gerado por IA
- **Notification**: notificações do usuário
- **Post** e **PostReply**: fórum de discussão por turma

Entidades planejadas (não implementadas):

- **Activity**: exercícios e tarefas *(pendente)*
- **Submission**: envio de solução do aluno *(pendente)*

Enums relevantes:

- Role: `ADMIN | PROFESSOR | ALUNO`
- Difficulty: `FACIL | MEDIO | DIFICIL`
- MissionType: `DIARIA | SEMANAL | PERSONALIZADA`
- MissionStatus: `NAO_INICIADA | EM_PROGRESSO | CONCLUIDA | EXPIRADA`

---

## 6. Backend — Módulos e Responsabilidades

### Auth

- Registro/login
- Refresh token
- Forgot/reset password
- Logout
- Guards JWT e Roles

### Users

- CRUD de usuários
- Perfil do usuário logado
- Upload de avatar
- Listagem com paginação/filtros

### Classes

- CRUD de turmas
- Matrícula/remoção de alunos
- Listagem de alunos por turma

### Activities *(não implementado)*

- CRUD de atividades
- Casos de teste por atividade
- Listagem com filtros e paginação

### Submissions *(não implementado)*

- Submissão de código
- Execução contra casos de teste
- Processamento de resultados
- Estatísticas do aluno

### Gamification

- Pontos por ação
- Cálculo de nível
- Ranking global/turma
- Conquistas

### Missions

- CRUD de missões
- Missões de quiz
- Progresso por aluno
- Rotinas automáticas (CRON)
- Geração diária de quiz com IA

### Notifications

- Listagem de notificações
- Marcar como lida
- Marcar todas como lidas
- Deleção de notificação
- Criação manual por professor/admin

### Dashboard

- Endpoint agregado para visão do aluno

---

## 7. API — Base e Endpoints Principais

### Base URL local

- `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/v1/docs`

### Grupos de rotas

- `/auth`
- `/users`
- `/classes`
- `/gamification`
- `/missions`
- `/notifications`
- `/posts`
- `/dashboard`
- `/activities` *(não implementado)*
- `/submissions` *(não implementado)*

---

## 8. Integrações Externas

### OpenAI

Usado para geração automática de quiz diário no módulo de missões.

- Chave via `OPENAI_API_KEY`
- Modelo configurável por `OPENAI_MODEL`
- Persistência de prompt/resposta em `AIGeneration`

---

## 9. Frontend — Organização e Fluxos

### Rotas públicas

- `/`
- `/docs`
- `/login`
- `/register`

### Área autenticada (dashboard)

- Aluno: home, turmas, missões, conquistas, posts, configurações
- Professor: turmas, gestão de alunos
- Atividades e submissões de código: *não implementadas no frontend*

### Estado de autenticação

- Zustand persistido em `localStorage`
- Interceptor Axios injeta `Authorization: Bearer`
- Em 401, logout automático

---

## 10. Como Executar Localmente

## Pré-requisitos

- Node.js 20+
- npm
- MySQL 8+

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 11. Variáveis de Ambiente (Backend)

Exemplo base:

- `NODE_ENV`
- `PORT`
- `API_PREFIX`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `OPENAI_API_KEY`
- `CORS_ORIGIN`
- `MAX_FILE_SIZE`
- `UPLOAD_DIR`

---

## 12. Scripts Importantes

### Backend

- `npm run start:dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`
- `npm run prisma:generate`
- `npm run prisma:migrate`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test:e2e`

---

## 13. Estado Atual e Pontos de Atenção

### Funcionalidades implementadas

- Núcleo de autenticação/autorização (JWT + refresh token)
- Gestão de usuários e turmas
- Sistema de gamificação (pontos, níveis, ranking, conquistas)
- Missões com quiz diário gerado por IA (CRON + OpenAI)
- Notificações em tempo real (WebSocket)
- Posts e fórum de discussão por turma
- Dashboard agregado do aluno

### O que ainda falta implementar

- **Módulo de Atividades** — sem model no banco, sem endpoints, sem UI
- **Módulo de Submissões de Código** — diretório existe mas está vazio; requer também serviço de execução de código (Judge0 ou Docker)
- Painel do professor para missões (criar, acompanhar progresso)
- Interface de admin

### Bugs conhecidos

- Reset de senha quebrado: `findByResetToken()` chamado sem argumento
- Frontend chama `GET /auth/me` que não existe (deveria ser `GET /users/me`)
- CORS permite qualquer origem (precisa restringir em produção)

---


## 15. Convenções e Diretrizes

- DTOs com validação via `class-validator`
- Endpoints documentados no Swagger
- Regra padrão de acesso protegida por JWT + roles
- Serviços de frontend centralizam chamadas HTTP
- Estado de autenticação isolado em store global

---

## 16. Glossário Rápido

- **Turma**: unidade acadêmica ativa no MVP (ex.: Turma A - Python)
- **Atividade**: tarefa avaliativa com ou sem código
- **Submissão**: envio de solução pelo aluno
- **Missão**: objetivo gamificado paralelo às atividades
- **Conquista**: badge desbloqueado por critério
- **Ranking**: ordenação de alunos por pontuação

---

## 17. Licença

Consulte os arquivos de licença e metadados do projeto para termos de uso vigentes.
