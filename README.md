<p align="center"><img src="frontend/public/auri_logo.webp" alt="AURI" width="140" /></p>

# AURI

Plataforma gamificada para ensino de programação. O monorepo reúne um frontend React/Vite, API NestJS/Prisma/MySQL e um executor de código Docker separado.

## Arquitetura

| Componente | Tecnologia | Responsabilidade |
| --- | --- | --- |
| `frontend/` | React, Vite, TypeScript | Interface para alunos, professores e administração |
| `backend/` | NestJS, Prisma, MySQL | API REST, autenticação, regras da plataforma e Swagger |
| runner | Node + Docker | Avalia submissões JavaScript/Python em contêineres isolados |

O frontend chama a API em `/api/v1`, a autenticação usa JWT de curta duração e cookie HttpOnly de refresh, e notificações usam Socket.IO. O quiz diário usa OpenAI somente quando `OPENAI_API_KEY` está configurada. O Swagger fica em `http://localhost:3001/api/v1/docs`.

## Requisitos

- Node.js 20+ e npm
- MySQL 8+ para desenvolvimento sem Docker
- Docker Compose para a instalação containerizada
- Docker Engine no host exclusivo do runner

## Configuração

Crie os arquivos locais a partir dos exemplos e substitua todos os valores de exemplo antes de produção:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

O exemplo já está pronto para Docker Compose, no qual `DATABASE_URL` usa o host `db`:

```dotenv
DATABASE_URL="mysql://auri:change-this-password@db:3306/auri"
```

`backend/.env.example` documenta configuração da aplicação, MySQL, JWT, URLs/CORS, SMTP, OpenAI, uploads e runner. `frontend/.env.example` contém apenas `VITE_API_URL`, pois variáveis `VITE_*` são públicas e incorporadas durante o build — nunca coloque segredos nelas.

## Desenvolvimento local

### Banco e backend

1. Crie um banco MySQL compatível com `DATABASE_URL` e, para MySQL rodando fora do Compose, troque o host `db` por `localhost`.
2. Instale dependências e prepare o Prisma:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed:achievements
npm run prisma:seed:activities # opcional: dados de exemplo para atividades
npm run start:dev
```

`prisma:migrate` usa `prisma migrate dev` e é destinado somente ao desenvolvimento. As migrations versionadas devem ser usadas para qualquer ambiente compartilhado ou de produção.

Esta revisão inclui a migration inicial versionada e uma migration aditiva para métricas de IA. Em uma instalação limpa, use `npm run prisma:migrate:deploy`. Para um banco AURI já existente que foi criado antes de haver migrations no repositório, faça backup e registre **somente** a baseline antes de aplicar a migration nova:

```bash
cd backend
npx prisma migrate resolve --applied 20260921000000_initial_schema
npm run prisma:migrate:deploy
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. A API padrão é `http://localhost:3001`.

## Primeiro administrador

O cadastro público aceita somente `ALUNO` e `PROFESSOR`; essa regra é intencional. Para bootstrap da primeira instalação:

1. cadastre uma conta normalmente;
2. abra o Prisma Studio (`cd backend && npm run prisma:studio`) e altere `users.role` para `ADMIN`; ou execute no MySQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

O schema Prisma confirma que a tabela é `users` e a coluna é `role`. Após isso, um ADMIN autenticado pode gerir perfis pelo painel/API administrativa. Não exponha um endpoint público para promoção a ADMIN.

## Docker Compose e produção

O arquivo [docker-compose.example.yml](docker-compose.example.yml) sobe MySQL, API e frontend para uma instalação local ou de pequena escala. Ele usa volumes persistentes para dados MySQL, uploads públicos e uploads privados; aguarda o healthcheck do MySQL antes da API; e a API aplica migrations com `prisma migrate deploy` antes de iniciar.

```bash
cp docker-compose.example.yml docker-compose.yml
# configure backend/.env com senhas fortes, DATABASE_URL usando host db e URLs de produção
docker compose up --build -d
```

Faça backup regular do volume `auri_mysql` (por exemplo, via `mysqldump` executado contra o serviço `db`) e preserve `auri_uploads` e `auri_private_uploads`; estes volumes armazenam dados que não podem ser reconstruídos pelo código. Em produção, use senhas/JWT aleatórios, TLS e URLs/CORS explícitas.

O [docker-compose.runner.example.yml](docker-compose.runner.example.yml) **não** faz parte da arquitetura recomendada no mesmo host. Execute-o apenas em VM/host dedicado, com acesso ao mesmo banco, pois ele recebe o socket Docker e executa código não confiável. O runner mantém rede desligada, filesystem raiz somente leitura, limites de CPU/memória/PIDs e capabilities removidas.

```bash
# somente no host isolado do runner
cp docker-compose.runner.example.yml docker-compose.runner.yml
docker compose -f docker-compose.runner.yml up -d --build
```

## OpenAI e auditoria

Cada quiz diário aprovado grava o prompt e a resposta aprovados. Além disso, registra modelo, tokens de entrada/saída/total, tentativas e validações agregados de todas as chamadas que produziram aquele quiz. Tentativas rejeitadas não têm prompt/resposta persistidos. Se alguma resposta da API não informar `usage`, os campos de tokens ficam indisponíveis (`NULL`) para não apresentar um total incompleto. As métricas aparecem em **Administração → Gerações de IA** e não armazenam preços.

## Verificação e testes

```bash
# backend
cd backend
npm run lint
npm run build
npm run test
npm run test:e2e              # requer MySQL configurado em DATABASE_URL
npm run test:runner
npm run test:runner:integration # opcional; requer Docker Engine ativo e imagens baixáveis
npm run verify

# frontend
cd frontend
npm run lint
npm run build
npm run test:e2e
npm run test:a11y
```

Os testes de integração do runner não fazem parte do conjunto normal/CI porque dependem do daemon Docker e de imagens `node:20-alpine` e `python:3.12-alpine`. Eles verificam execução JavaScript/Python, timeout, rede desligada e root filesystem somente leitura.

O workflow [CI](.github/workflows/ci.yml) valida lint, build, testes backend (com MySQL de serviço), frontend e acessibilidade em push/PR. O workflow de deploy existente permanece separado e inalterado.

## Rotas principais

- API: `http://localhost:3001/api/v1`
- Healthcheck: `GET /api/v1/health` (status da API, banco e timestamp)
- Swagger: `http://localhost:3001/api/v1/docs`
- Frontend: `http://localhost:5173`

## Licença

MIT. Consulte [LICENSE](LICENSE).
