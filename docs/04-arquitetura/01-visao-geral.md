# 4.1 Visão Geral da Arquitetura

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                      │
│            React SPA + TypeScript               │
│   ┌───────────┬───────────┬──────────────┐     │
│   │ Dashboard │ Activities│ Gamification │     │
│   └───────────┴───────────┴──────────────┘     │
└────────────────────┬────────────────────────────┘
                     │ HTTPS / REST API
                     │ WebSockets (notifications)
┌────────────────────┴────────────────────────────┐
│                   BACKEND                       │
│          Node.js + Express + TypeScript         │
│   ┌──────────────────────────────────────┐     │
│   │       API Layer (Controllers)        │     │
│   ├──────────────────────────────────────┤     │
│   │      Business Logic (Services)       │     │
│   ├──────────────────────────────────────┤     │
│   │     Data Access (Repositories)       │     │
│   └──────────────────────────────────────┘     │
│   ┌──────────┬──────────┬──────────┐           │
│   │ Auth     │ AI Svc   │ Gamif.   │           │
│   │ Service  │          │ Service  │           │
│   └──────────┴──────────┴──────────┘           │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼───────┐ ┌─▼──────────┐
│  PostgreSQL  │ │  Redis   │ │ AI API     │
│  (Main DB)   │ │ (Cache)  │ │ (OpenAI)   │
└──────────────┘ └──────────┘ └────────────┘
```

---

## Princípios Arquiteturais

### 1. Separação de Responsabilidades
- **Frontend**: UI/UX e lógica de apresentação
- **Backend**: Lógica de negócio e persistência
- **Banco de Dados**: Armazenamento persistente

### 2. Arquitetura em Camadas (Layered Architecture)

```
┌─────────────────────────────────┐
│   Presentation Layer            │  ← Controllers, Routes
├─────────────────────────────────┤
│   Business Logic Layer          │  ← Services, Use Cases
├─────────────────────────────────┤
│   Data Access Layer             │  ← Repositories, ORM
├─────────────────────────────────┤
│   Database Layer                │  ← PostgreSQL
└─────────────────────────────────┘
```

**Benefícios**:
- Facilita testes (mockear camadas)
- Manutenção simplificada
- Código desacoplado

### 3. API-First Design
- API REST bem definida
- Documentação automática (Swagger/OpenAPI)
- Versionamento de API
- Frontend consome exclusivamente via API

### 4. Modularidade
- Cada módulo (usuários, gamificação, IA) é independente
- Interfaces bem definidas entre módulos
- Facilita expansão futura

---

## Tecnologias Escolhidas

### Frontend

**Framework**: React 18+
- ✅ Ecossistema maduro
- ✅ Componentização
- ✅ Grande comunidade
- ✅ Performance

**Linguagem**: TypeScript
- ✅ Type safety
- ✅ Melhor IDE support
- ✅ Reduz bugs

**Gerenciamento de Estado**: Context API + React Query
- Context API: estado global simples
- React Query: cache e sincronização com backend

**Estilização**: TailwindCSS
- ✅ Utility-first
- ✅ Responsivo por padrão
- ✅ Customizável
- ✅ Build otimizado

**Gráficos**: Chart.js ou Recharts
- Visualização de progresso e estatísticas

**Build Tool**: Vite
- ✅ Rápido
- ✅ HMR eficiente
- ✅ Otimização automática

---

### Backend

**Runtime**: Node.js 20 LTS
- ✅ Performance
- ✅ Ecossistema npm
- ✅ Async/await nativo

**Framework**: Express.js
- ✅ Minimalista e flexível
- ✅ Middleware ecosystem
- ✅ Bem documentado

**Linguagem**: TypeScript
- ✅ Consistência com frontend
- ✅ Type safety em toda stack

**ORM**: Prisma
- ✅ Type-safe queries
- ✅ Migrations automáticas
- ✅ Excelente DX

**Validação**: Zod
- ✅ Type-safe validation
- ✅ Inferência de tipos
- ✅ Mensagens de erro claras

**Autenticação**: JWT (jsonwebtoken)
- ✅ Stateless
- ✅ Escalável
- ✅ Padrão da indústria

**WebSockets**: Socket.io
- Notificações em tempo real
- Atualizações de ranking

---

### Banco de Dados

**Principal**: PostgreSQL 15+
- ✅ Relacional robusto
- ✅ JSON support (para configurações)
- ✅ Performance
- ✅ Open source

**Cache**: Redis
- Session storage
- Cache de queries frequentes
- Rate limiting

---

### Infraestrutura

**Containerização**: Docker + Docker Compose
- Ambientes consistentes
- Fácil deploy
- Desenvolvimento local simplificado

**CI/CD**: GitHub Actions
- Testes automáticos
- Build e deploy automatizados

**Logs**: Winston (Node.js)
- Estruturados
- Múltiplos transportes

**Documentação API**: Swagger/OpenAPI
- Auto-gerada do código
- Interface interativa

---

## Padrões de Projeto

### 1. Repository Pattern
```typescript
interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: number, data: UpdateUserDTO): Promise<User>;
  delete(id: number): Promise<void>;
}
```

### 2. Service Layer Pattern
```typescript
class UserService {
  constructor(private userRepo: IUserRepository) {}
  
  async registerUser(data: RegisterDTO): Promise<User> {
    // Lógica de negócio aqui
  }
}
```

### 3. Dependency Injection
```typescript
// Container de DI
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);
```

### 4. Factory Pattern
Para criação de instâncias complexas (ex: AI providers)

### 5. Strategy Pattern
Para diferentes estratégias de pontuação, níveis, etc.

---

## Segurança

### Camadas de Segurança

**1. Autenticação**
- JWT tokens
- Refresh tokens
- Password hashing (bcrypt)

**2. Autorização**
- Role-based access control (RBAC)
- Middleware de verificação de permissões

**3. Input Validation**
- Validação com Zod
- Sanitização de entrada

**4. Rate Limiting**
- Limite por IP
- Limite por usuário
- Redis para tracking

**5. HTTPS**
- Certificados SSL/TLS
- Redirecionamento HTTP → HTTPS

**6. CORS**
- Configuração restritiva
- Whitelist de origens

**7. Headers de Segurança**
- Helmet.js
- CSP, HSTS, etc.

---

## Escalabilidade

### Estratégias

**1. Horizontal Scaling**
- Stateless backend permite múltiplas instâncias
- Load balancer (Nginx/HAProxy)

**2. Caching**
- Redis para dados frequentes
- Cache de queries no React Query

**3. Database Optimization**
- Índices apropriados
- Query optimization
- Connection pooling

**4. CDN**
- Assets estáticos
- Frontend build

**5. Async Processing**
- Fila de jobs (Bull/BullMQ)
- Background tasks (envio de email, cálculos)

---

## Observabilidade

### Logging
```typescript
logger.info('User logged in', {
  userId: user.id,
  timestamp: new Date(),
  ip: req.ip
});
```

### Metrics
- Tempo de resposta de APIs
- Taxa de erro
- Uso de recursos

### Monitoring
- Health checks
- Uptime monitoring
- Error tracking (Sentry)

---

## Ambientes

### Development
```yaml
NODE_ENV: development
DATABASE_URL: postgresql://localhost:5432/auri_dev
REDIS_URL: redis://localhost:6379
AI_API_KEY: sk-test-...
```

### Staging
```yaml
NODE_ENV: staging
DATABASE_URL: postgresql://staging-db:5432/auri_staging
# Dados de teste
```

### Production
```yaml
NODE_ENV: production
DATABASE_URL: postgresql://prod-db:5432/auri_prod
# Configurações otimizadas
```

---

## Diagrama de Componentes

```
┌────────────────────────────────────────────┐
│             React Frontend                 │
│  ┌──────────────────────────────────────┐  │
│  │  Components                          │  │
│  │  - Dashboard                         │  │
│  │  - Activities                        │  │
│  │  - Gamification                      │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  State Management                    │  │
│  │  - Context API (global state)        │  │
│  │  - React Query (server state)        │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  API Client (Axios)                  │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
                     ↕ HTTPS
┌────────────────────────────────────────────┐
│           Express Backend                  │
│  ┌──────────────────────────────────────┐  │
│  │  Middlewares                         │  │
│  │  - Auth, CORS, Helmet, Rate Limit    │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  Controllers (Routes)                │  │
│  │  - UserController                    │  │
│  │  - ActivityController                │  │
│  │  - GamificationController            │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  Services (Business Logic)           │  │
│  │  - UserService                       │  │
│  │  - ActivityService                   │  │
│  │  - GamificationService               │  │
│  │  - AIService                         │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  Repositories (Data Access)          │  │
│  │  - UserRepository                    │  │
│  │  - ActivityRepository                │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
                     ↕
┌────────────────────────────────────────────┐
│           PostgreSQL + Redis               │
└────────────────────────────────────────────┘
```

---

## Fluxo de Request Típico

```
1. User Action (Frontend)
   ↓
2. API Call (axios)
   ↓
3. Backend Route (Express)
   ↓
4. Middleware (Auth, Validation)
   ↓
5. Controller (request handling)
   ↓
6. Service (business logic)
   ↓
7. Repository (data access)
   ↓
8. Database (PostgreSQL)
   ↓
9. Response back up the chain
   ↓
10. Frontend updates UI
```

---

## Decisões Arquiteturais Importantes

### Por Que Monolito (não Microservices)?

**Justificativa**:
- ✅ Escopo de TCC é limitado
- ✅ Complexidade reduzida
- ✅ Deploy mais simples
- ✅ Desenvolvimento mais rápido
- ✅ Suficiente para escala esperada

**Futuro**: Pode evoluir para microservices se necessário

### Por Que PostgreSQL (não MongoDB)?

**Justificativa**:
- ✅ Dados são relacionais (turmas, alunos, atividades)
- ✅ Integridade referencial importante
- ✅ Suporte a transações
- ✅ Consultas complexas (rankings, estatísticas)

### Por Que JWT (não Sessions)?

**Justificativa**:
- ✅ Stateless (facilita escalar)
- ✅ Pode ser usado em múltiplos servidores
- ✅ Padrão da indústria para APIs

---

## Trade-offs e Limitações

### Trade-offs Aceitos

1. **Monolito vs Microservices**
   - ➕ Mais simples
   - ➖ Menos flexibilidade para escalar partes específicas

2. **REST vs GraphQL**
   - ➕ REST é mais simples e conhecido
   - ➖ GraphQL seria mais eficiente em algumas queries

3. **SQL vs NoSQL**
   - ➕ SQL garante consistência
   - ➖ NoSQL seria mais flexível

### Limitações Conhecidas

1. **Processamento de Código**
   - Sistema não compila/executa código localmente
   - Pode usar juiz online externo (futuro)

2. **Escala**
   - Projetado para centenas/milhares de usuários
   - Não para milhões (ainda)

3. **Real-time Collaboration**
   - Não suporta edição colaborativa de código (futuro)

---

## Próximos Passos

1. **Documentar Backend** em [02-backend.md](02-backend.md)
2. **Documentar Frontend** em [03-frontend.md](03-frontend.md)
3. **Modelar Banco** em [04-banco-dados.md](04-banco-dados.md)
4. **Definir APIs** em [05-integracoes.md](05-integracoes.md)
