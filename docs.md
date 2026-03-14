# AURI — Docs

## 1. Visão Geral

O **AURI** é uma plataforma web gamificada para apoio ao ensino de programação, com perfis de **Aluno**, **Professor** e **Admin**.

A solução é dividida em:

- **Backend** em NestJS com Prisma e MySQL
- **Frontend** em React + TypeScript + Vite
- **Execução de código** via Judge0
- **Recursos de IA** para geração de quiz/missões

Objetivos centrais da plataforma:

- Gestão acadêmica de disciplinas e turmas
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
├── docs.md           # Documentação central do projeto
└── ESTRUTURA.md      # Arquivo legado da organização inicial
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

Entidades principais:

- **User**: autenticação e perfil
- **Discipline**: disciplina criada por professor
- **Class** e **ClassStudent**: turmas e matrículas
- **Activity** e **TestCase**: exercícios e casos de teste
- **Submission**: envio de solução do aluno
- **UserPoint**, **Achievement**, **UserAchievement**, **Ranking**: gamificação
- **Mission**, **MissionQuiz**, **MissionQuizAttempt**, **UserMission**: missões
- **AIGeneration**: histórico de conteúdo gerado por IA
- **Notification**: notificações do usuário

Enums relevantes:

- Role: `ADMIN | PROFESSOR | ALUNO`
- ActivityType: `EXERCICIO | QUIZ | DESAFIO | PROJETO`
- Difficulty: `FACIL | MEDIO | DIFICIL`
- SubmissionStatus: `PENDENTE | EXECUTANDO | APROVADO | PARCIAL | REPROVADO | ERRO`

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

### Disciplines

- CRUD de disciplinas
- Regras de permissão por perfil
- Filtros e paginação

### Classes

- CRUD de turmas
- Matrícula/remoção de alunos
- Listagem de alunos por turma

### Activities

- CRUD de atividades
- Casos de teste por atividade
- Listagem com filtros e paginação
- Consulta de atividades próximas

### Submissions

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
- `/disciplines`
- `/classes`
- `/activities`
- `/submissions`
- `/gamification`
- `/missions`
- `/notifications`
- `/dashboard`

---

## 8. Integrações Externas

### Judge0

Responsável pela execução de código submetido pelos alunos.

- URL configurável via `JUDGE0_URL`
- Linguagens mapeadas: JavaScript, TypeScript, Python, Java, C, C++
- Usa polling de resultado por token

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

- Aluno: home, turmas, atividade, missões, conquistas, configurações
- Professor: disciplinas, turmas, criação de atividade, submissões

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
- Judge0 (opcional para fluxo completo de submissão)

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
- `JUDGE0_URL`
- `JUDGE0_AUTH_TOKEN`
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

- Núcleo de autenticação/autorização
- Gestão de usuários, disciplinas, turmas e atividades
- Submissões com processamento e estatísticas
- Sistema de gamificação (pontos, níveis, ranking, conquistas)
- Missões com automação diária/semanal
- Notificações e dashboard do aluno

### Débitos técnicos identificados

- Divergências de contrato de tipos entre frontend e backend em partes de atividades/submissões
- Build do frontend com erros de tipagem TypeScript em alguns fluxos
- Testes unitários backend com falhas por mocks desatualizados em parte da suíte
- Endurecimento de segurança pendente em alguns pontos (CORS amplo em dev e fluxo de recuperação de senha com comportamento temporário)

---

## 14. Roadmap Sugerido

### Curto prazo

1. Corrigir erros de compilação TypeScript no frontend
2. Alinhar tipos/DTOs entre frontend e backend
3. Ajustar testes unitários quebrados do backend
4. Consolidar segurança básica de produção

### Médio prazo

1. Expandir testes de integração/e2e
2. Melhorar observabilidade (logs estruturados, health checks, métricas)
3. Revisar UX de fluxos de professor/aluno

### Longo prazo

1. Pipeline CI/CD completo
2. Cache e otimizações de desempenho
3. Evolução do módulo de IA com revisão pedagógica avançada

---

## 15. Convenções e Diretrizes

- DTOs com validação via `class-validator`
- Endpoints documentados no Swagger
- Regra padrão de acesso protegida por JWT + roles
- Serviços de frontend centralizam chamadas HTTP
- Estado de autenticação isolado em store global

---

## 16. Glossário Rápido

- **Disciplina**: unidade acadêmica (ex.: Algoritmos)
- **Turma**: oferta da disciplina em período específico
- **Atividade**: tarefa avaliativa com ou sem código
- **Submissão**: envio de solução pelo aluno
- **Missão**: objetivo gamificado paralelo às atividades
- **Conquista**: badge desbloqueado por critério
- **Ranking**: ordenação de alunos por pontuação

---

## 17. Licença

Consulte os arquivos de licença e metadados do projeto para termos de uso vigentes.
