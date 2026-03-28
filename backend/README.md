# AURI Backend

Backend da plataforma gamificada de ensino de programação AURI.

## 🚀 Tecnologias

- **NestJS 10+** - Framework Node.js
- **Prisma** - ORM
- **MySQL 8** - Banco de dados
- **JWT** - Autenticação
- **Swagger** - Documentação da API

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações
```

## 🗄️ Database

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio
```

## 🏃 Executar

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run start:prod
```

## 📚 API Documentation

Após iniciar o servidor, acesse:

- Swagger: http://localhost:3001/api/v1/docs

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 🐳 Docker

```bash
# Build
docker build -t auri-backend .

# Run
docker run -p 3001:3001 --env-file .env auri-backend
```

## 📁 Estrutura

```
src/
├── modules/
│   ├── auth/          # Autenticação e Guards (JWT, roles)
│   ├── users/         # Gerenciamento de Usuários e avatars
│   ├── classes/       # Turmas e Matrículas
│   ├── gamification/  # Pontos, Níveis, Conquistas e Ranking
│   ├── missions/      # Missões, Quiz Diário (CRON + OpenAI)
│   ├── notifications/ # Notificações + WebSocket Gateway
│   ├── posts/         # Posts e Respostas por Turma
│   ├── dashboard/     # Agregação de dados do Aluno
│   ├── submissions/   # ⚠️ Não implementado
│   └── prisma/        # PrismaService
├── app.module.ts
└── main.ts
```

## 🔐 Variáveis de Ambiente

Ver arquivo `.env.example` para referência.

## 📄 License

MIT
