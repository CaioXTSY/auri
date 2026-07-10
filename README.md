<p align="center">
  <img src="frontend/public/auri_logo.webp" alt="AURI" width="140" />
</p>

<h1 align="center">AURI</h1>

<p align="center">
  Plataforma web para ensino de programação com turmas, missões, gamificação e painel administrativo.
</p>

## Sobre

A AURI é um monorepo com duas aplicações:

- `frontend`: React + Vite
- `backend`: NestJS + Prisma + MySQL

O sistema atende três perfis atualmente:

- `ALUNO`: entra em turmas, responde quizzes, acompanha ranking e conquistas
- `PROFESSOR`: cria turmas, acompanha alunos e publica postagens
- `ADMIN`: gerencia usuários, turmas, missões, conquistas, notificações e métricas

## Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- React Hook Form + Zod
- Tailwind CSS
- Socket.IO Client
- Playwright

### Backend

- NestJS 11
- Prisma
- MySQL
- JWT + Passport
- Socket.IO
- Swagger
- OpenAI API
- Jest + Supertest

## Estrutura

```txt
.
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── prisma/
│   │   └── modules/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── classes/
│   │       ├── missions/
│   │       ├── gamification/
│   │       ├── dashboard/
│   │       ├── posts/
│   │       ├── notifications/
│   │       └── admin/
│   └── test/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/
│   │   └── stores/
└── .github/workflows/
```

## Arquitetura

- o frontend consome a API REST do backend via Axios
- autenticação usa `access_token` no header e `refresh_token` em cookie HttpOnly
- notificações em tempo real usam Socket.IO
- dados persistem em MySQL via Prisma
- o quiz diário pode ser gerado pela OpenAI

## Principais áreas

### Frontend

- landing page pública
- documentação pública em `/docs`
- dashboard do aluno
- dashboard do professor
- painel admin
- mural com editor markdown
- onboarding guiado por perfil

### Backend

- autenticação e refresh de sessão
- gestão de usuários
- turmas e matrícula por código
- missões e quiz diário
- pontos, níveis, streak, conquistas e ranking
- notificações REST + WebSocket
- auditoria administrativa de gerações de IA

## Rotas

### Frontend

- `/`
- `/docs`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/dashboard/classes`
- `/dashboard/missions`
- `/dashboard/posts`
- `/dashboard/settings`
- `/dashboard/teacher/classes`
- `/admin`

### API

Base padrão: `http://localhost:3001/api/v1`

Grupos principais:

- `/auth`
- `/users`
- `/classes`
- `/missions`
- `/gamification`
- `/dashboard`
- `/notifications`
- `/posts`
- `/admin`

Swagger:

- `http://localhost:3001/api/v1/docs`

## Instalação

### Pré-requisitos

- Node.js 20+
- npm
- MySQL

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed:achievements
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variáveis de ambiente

### Backend

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Conexão com MySQL |
| `JWT_SECRET` | Segredo do access token |
| `JWT_EXPIRES_IN` | Expiração do access token |
| `JWT_REFRESH_SECRET` | Segredo do refresh token |
| `PORT` | Porta HTTP |
| `API_PREFIX` | Prefixo da API |
| `NODE_ENV` | Ambiente |
| `CORS_ORIGINS` | Origens liberadas |
| `FRONTEND_URL` | URL do frontend |
| `BACKEND_URL` | URL adicional do backend |
| `OPENAI_API_KEY` | Chave da OpenAI |
| `OPENAI_MODEL` | Modelo usado no quiz diário |
| `APP_TIME_ZONE` | Timezone do cálculo do quiz diário |

### Frontend

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | URL base da API e do Socket.IO |

## Scripts

### Backend

- `npm run build`
- `npm run start`
- `npm run start:dev`
- `npm run start:prod`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`
- `npm run prisma:seed:achievements`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
- `npm run test:e2e`

## Banco de dados

Modelos principais:

- `User`
- `Class`
- `ClassStudent`
- `Mission`
- `MissionQuiz`
- `MissionQuizAttempt`
- `UserMission`
- `UserPoint`
- `Achievement`
- `UserAchievement`
- `Ranking`
- `Notification`
- `Post`
- `PostReply`
- `AIGeneration`

## Testes

### Backend

- Jest
- Supertest
- cobertura atual focada em autenticação e usuários

### Frontend

- Playwright
- cobertura atual focada em navegação básica

## Deploy

- Docker para frontend e backend
- O runner de codigo deve rodar em host/VM isolado; veja [RUNNER_DEPLOYMENT.md](RUNNER_DEPLOYMENT.md)
- GitHub Actions com deploy via SSH em `main`
- script remoto usado no workflow: `auri_deploy.sh`

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
