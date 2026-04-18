# AURI

Plataforma web gamificada para apoio ao ensino de programação.

```
auri/
├── backend/    # NestJS + Prisma + MySQL
├── frontend/   # React + Vite + TypeScript
└── docs/       # Análise de status e issues
```

---

## Stack

**Backend:** NestJS · Prisma · MySQL · JWT (access + refresh cookie) · Socket.io · OpenAI · Swagger

**Frontend:** React 19 · Vite · React Router · Zustand · TanStack Query · React Hook Form + Zod · Tailwind · shadcn/ui · Monaco Editor

**Testes:** Jest (backend) · Playwright (frontend e2e)

---

## Como rodar

### Backend

```bash
cd backend
npm install
cp .env.example .env   # preencher variáveis abaixo
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

## Variáveis de ambiente (backend)

```env
NODE_ENV=
PORT=
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=
CORS_ORIGINS=               # vírgula-separado, ex: http://localhost:5173
FRONTEND_URL=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
UPLOAD_DIR=
MAX_FILE_SIZE=
```

---

## API

Base: `http://localhost:3001/api/v1`  
Swagger: `http://localhost:3001/api/v1/docs`

Rotas: `/auth` `/users` `/classes` `/gamification` `/missions` `/notifications` `/posts` `/dashboard`

---

## Estado atual

**Implementado**
- Auth completo: registro, login, refresh token, forgot/reset password
- Turmas: CRUD, matrícula, remoção de alunos
- Gamificação: XP, níveis, conquistas, ranking global/turma
- Missões diárias/semanais com quiz gerado por IA (CRON + OpenAI)
- Notificações em tempo real (WebSocket)
- Posts/fórum por turma (com editor Monaco)
- Dashboard do aluno e dashboard do professor

**Pendente**
- Módulo de Atividades e Submissões — sem model no banco, sem endpoints, sem UI
- Criação de missões personalizadas pelo professor via UI
- Painel admin
- Autenticação JWT no WebSocket de notificações (aceita `userId` sem verificar token)
