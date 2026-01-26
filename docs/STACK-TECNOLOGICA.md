# Stack Tecnológica - Plataforma AURI

## 📋 Visão Geral

Este documento define as tecnologias, ferramentas e arquitetura do projeto.

---

## 🎨 Frontend

### Framework Principal

**React 18+** com TypeScript

**Justificativa:**
- Ecossistema maduro e ampla comunidade
- TypeScript para tipagem estática e maior segurança
- Performance otimizada com Virtual DOM
- Facilita manutenção e escalabilidade

### Bibliotecas e Ferramentas

| Tecnologia | Uso | Versão |
|------------|-----|--------|
| **Vite** | Build tool e dev server | 5.x |
| **React Router** | Roteamento SPA | 6.x |
| **TanStack Query** | Gerenciamento de estado servidor | 5.x |
| **Zustand** | Estado global cliente | 4.x |
| **Axios** | Cliente HTTP | 1.x |
| **Tailwind CSS** | Estilização | 3.x |
| **Shadcn/ui** | Componentes UI | Latest |
| **Recharts** | Gráficos e visualizações | 2.x |
| **React Hook Form** | Gerenciamento de formulários | 7.x |
| **Zod** | Validação de schemas | 3.x |
| **Monaco Editor** | Editor de código | Latest |

### Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── ui/          # Componentes base (shadcn)
│   │   ├── layouts/     # Layouts da aplicação
│   │   └── features/    # Componentes por funcionalidade
│   ├── pages/           # Páginas/rotas
│   ├── hooks/           # Custom hooks
│   ├── services/        # Serviços e API calls
│   ├── stores/          # Zustand stores
│   ├── types/           # TypeScript types
│   ├── utils/           # Funções utilitárias
│   ├── assets/          # Imagens, ícones, etc
│   └── main.tsx         # Entry point
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🧱 Backend

### Framework Principal

**NestJS 10+** com TypeScript

**Justificativa:**
- Arquitetura modular e escalável
- TypeScript nativo
- Injeção de dependências
- Decorators para código limpo
- Suporte nativo para testes
- Integração fácil com ORMs e validação

### Bibliotecas e Ferramentas

| Tecnologia | Uso | Versão |
|------------|-----|--------|
| **TypeORM** | ORM para banco de dados | 0.3.x |
| **PostgreSQL** | Banco de dados relacional | 16.x |
| **Redis** | Cache e sessões | 7.x |
| **JWT** | Autenticação | Latest |
| **Passport** | Estratégias de auth | Latest |
| **Class Validator** | Validação de DTOs | Latest |
| **Swagger** | Documentação da API | Latest |
| **Bull** | Filas de jobs | Latest |
| **Socket.io** | WebSocket (notificações) | 4.x |
| **Multer** | Upload de arquivos | Latest |

### Estrutura do Projeto

```
backend/
├── src/
│   ├── modules/              # Módulos da aplicação
│   │   ├── auth/            # Autenticação
│   │   ├── users/           # Usuários
│   │   ├── disciplines/     # Disciplinas
│   │   ├── activities/      # Atividades
│   │   ├── submissions/     # Submissões
│   │   ├── gamification/    # Gamificação
│   │   ├── ai/              # Integração IA
│   │   ├── execution/       # Execução de código
│   │   └── notifications/   # Notificações
│   ├── common/              # Código compartilhado
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── filters/
│   │   ├── pipes/
│   │   └── interceptors/
│   ├── config/              # Configurações
│   ├── database/            # Migrations e seeds
│   └── main.ts              # Entry point
├── test/
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 🗄️ Banco de Dados

### PostgreSQL 16

**Schema Principal:**

```sql
-- Usuários
users (id, email, password, role, name, avatar, created_at, updated_at)

-- Disciplinas
disciplines (id, name, description, language, status, created_at)

-- Turmas
classes (id, discipline_id, semester, year, status, created_at)

-- Alunos em Turmas
class_students (class_id, user_id, enrolled_at)

-- Atividades
activities (id, class_id, title, description, type, difficulty, 
           points, deadline, allow_resubmit, created_by, created_at)

-- Submissões
submissions (id, activity_id, user_id, code, language, 
            status, result, points_earned, submitted_at)

-- Gamificação
user_points (user_id, class_id, total_points, level, created_at)
achievements (id, name, description, icon, criteria)
user_achievements (user_id, achievement_id, earned_at)
rankings (id, class_id, user_id, rank, period, updated_at)

-- Missões
missions (id, class_id, title, description, type, points, 
         start_date, end_date, created_by)
user_missions (user_id, mission_id, status, completed_at)

-- IA
ai_generations (id, type, prompt, response, reviewed_by, 
               published, created_at)

-- Notificações
notifications (id, user_id, type, title, message, read, created_at)
```

### Redis

**Usos:**
- Cache de rankings
- Sessões de usuário
- Rate limiting
- Cache de respostas da IA
- Fila de execuções de código

---

## 🐳 Infraestrutura e DevOps

### Docker e Docker Compose

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    environment:
      - VITE_API_URL=http://localhost:3001
    depends_on:
      - backend

  # Backend
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/auri
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=auri
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Code Executor (Isolado)
  code-executor:
    build: ./code-executor
    ports:
      - "3002:3002"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE

volumes:
  postgres_data:
  redis_data:
```

---

## 🔧 Ambiente de Execução de Código

### Arquitetura

O ambiente de execução será **isolado** do backend principal por questões de segurança.

### Opções de Implementação

#### **Opção 1: Judge0 (Recomendada para MVP)**

**Vantagens:**
- ✅ Solução pronta e madura
- ✅ Suporta 60+ linguagens
- ✅ API REST simples
- ✅ Isolamento via Docker
- ✅ Limitação de recursos (CPU, memória, tempo)
- ✅ Open source

**Implementação:**

```yaml
# docker-compose.yml
services:
  judge0:
    image: judge0/judge0:latest
    ports:
      - "2358:2358"
    environment:
      - REDIS_HOST=redis
      - POSTGRES_HOST=postgres
    depends_on:
      - redis
      - postgres
```

**Fluxo de Execução:**

```
1. Aluno submete código
2. Backend valida e envia para Judge0
3. Judge0 executa em container isolado
4. Retorna resultado (saída, erro, tempo, memória)
5. Backend armazena resultado e atualiza pontos
```

#### **Opção 2: Execução Customizada (Para o futuro)**

**Tecnologias:**
- **Docker SDK**: Criar containers efêmeros
- **gVisor**: Sandboxing adicional
- **Node.js**: Serviço de execução

**Estrutura:**

```
code-executor/
├── src/
│   ├── executors/
│   │   ├── python.executor.ts
│   │   ├── java.executor.ts
│   │   ├── c.executor.ts
│   │   └── javascript.executor.ts
│   ├── sandbox/
│   │   └── docker.manager.ts
│   ├── validators/
│   │   └── code.validator.ts
│   └── main.ts
└── Dockerfile
```

**Dockerfile para Execução Isolada:**

```dockerfile
FROM node:20-alpine

# Instalar Docker CLI
RUN apk add --no-cache docker-cli

# Instalar compiladores e interpretadores
RUN apk add --no-cache \
    python3 \
    openjdk17 \
    gcc \
    g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "dist/main.js"]
```

### Limitações de Segurança

```typescript
// Configurações de segurança
const EXECUTION_LIMITS = {
  maxExecutionTime: 5000,      // 5 segundos
  maxMemory: 128 * 1024 * 1024, // 128 MB
  maxOutputSize: 1024 * 1024,   // 1 MB
  maxCpuUsage: 50,              // 50% de 1 core
  networkDisabled: true,        // Sem acesso à rede
  readOnlyFs: true,             // Filesystem read-only
};
```

### Testes Automatizados

```typescript
// Exemplo de teste de atividade
interface TestCase {
  input: string;
  expectedOutput: string;
  points: number;
}

const activity = {
  title: "Soma de dois números",
  testCases: [
    { input: "2 3", expectedOutput: "5", points: 25 },
    { input: "10 20", expectedOutput: "30", points: 25 },
    { input: "-5 5", expectedOutput: "0", points: 25 },
    { input: "0 0", expectedOutput: "0", points: 25 },
  ]
};
```

---

## 🤖 Integração com IA

### OpenAI API

**Modelo:** GPT-4 Turbo ou GPT-4

**Uso:**
- Geração de questões
- Geração de quizzes
- Sugestões de missões
- Mensagens motivacionais

**Implementação:**

```typescript
// backend/src/modules/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateQuestion(params: {
    language: string;
    difficulty: string;
    topic: string;
  }) {
    const prompt = `Gere uma questão de programação em ${params.language}
                   com dificuldade ${params.difficulty} sobre ${params.topic}.
                   
                   Formato JSON:
                   {
                     "title": "título",
                     "description": "descrição detalhada",
                     "testCases": [
                       {"input": "...", "output": "..."}
                     ],
                     "hints": ["dica 1", "dica 2"]
                   }`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

**Limites e Cache:**
- Rate limiting: 10 requisições/minuto por professor
- Cache no Redis: 24 horas
- Revisão obrigatória antes de publicar

---

## 🧪 Testes

### Frontend

- **Vitest**: Testes unitários
- **Testing Library**: Testes de componentes
- **Playwright**: Testes E2E

### Backend

- **Jest**: Framework de testes
- **Supertest**: Testes de API
- **TypeORM Testing**: Testes de banco

---

## 🚀 Deploy

### Desenvolvimento

```bash
docker-compose up -d
```

### Produção

**Opções:**
1. **AWS**: EC2 + RDS + ElastiCache
2. **DigitalOcean**: Droplets + Managed Database
3. **Vercel** (Frontend) + **Railway** (Backend)
4. **Render**: All-in-one

### CI/CD

**GitHub Actions:**

```yaml
name: CI/CD

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          docker-compose -f docker-compose.test.yml up --abort-on-container-exit

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy script
```

---

## 📊 Monitoramento

### Ferramentas

- **Prometheus**: Métricas
- **Grafana**: Dashboards
- **Sentry**: Error tracking
- **Winston**: Logs estruturados

---

## 🔐 Segurança

### Práticas

- ✅ HTTPS obrigatório
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Helmet.js (headers de segurança)
- ✅ Sanitização de inputs
- ✅ Parametrized queries (SQL injection)
- ✅ JWT com refresh tokens
- ✅ Bcrypt para senhas (salt rounds: 10)
- ✅ Validação de uploads (tipo, tamanho)
- ✅ Isolamento de execução de código
- ✅ Auditoria de ações sensíveis

---

## 📝 Variáveis de Ambiente

```env
# Backend
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/auri
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
OPENAI_API_KEY=sk-...

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Judge0
JUDGE0_URL=http://localhost:2358
JUDGE0_AUTH_TOKEN=your-token
```

---

**Última atualização**: Janeiro de 2026
