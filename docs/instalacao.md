# Instalação

## Pré-requisitos

- Node.js 22.12+ da linha 22 e npm. A versão principal também está em `.nvmrc`, no CI e nos Dockerfiles.
- MySQL 8 com um banco e um usuário próprios para a aplicação.
- SMTP acessível para recuperação de senha. Na implementação atual, `SMTP_HOST`, `SMTP_USER` e `SMTP_PASS` são exigidos na inicialização, mesmo antes de enviar um e-mail.
- Docker Engine para atividades de programação. Docker Compose também pode executar banco, API e frontend.
- Chave OpenAI somente se quiser habilitar a geração do quiz diário.

## 1. Configurar o ambiente

Na raiz, copie os exemplos sem sobrescrever configurações já existentes:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

No PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Edite os arquivos antes de iniciar:

| Configuração | Desenvolvimento local | Compose |
| --- | --- | --- |
| Host de `DATABASE_URL` | `localhost` ou endereço do MySQL | `db` |
| `FRONTEND_URL`, `CORS_ORIGINS`, `CORS_ORIGIN` | `http://localhost:5173` | `http://localhost:3010` |
| `BACKEND_URL` | `http://localhost:3001` | `http://localhost:3001` |
| `VITE_API_URL` | Origem da API, sem `/api/v1` | Argumento de build do Compose |

Troque `JWT_SECRET` e `JWT_REFRESH_SECRET` por valores aleatórios diferentes. Configure as credenciais de banco e SMTP. Os valores `change-this-*` e `replace-with-*` são marcadores de exemplo.

O Compose lê `MYSQL_*` de `backend/.env`; usuário, senha e banco devem corresponder a `DATABASE_URL`. Senhas com caracteres reservados precisam de codificação na URL de conexão.

Arquivos `.env` e `.env.production` locais não são publicados. Nenhuma chave de SMTP, JWT, banco ou OpenAI deve ir para `VITE_*`, cujos valores são públicos.

## 2. Preparar banco e API

Crie um banco MySQL vazio para a AURI e ajuste `DATABASE_URL`:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed:achievements
npm run start:dev
```

As migrations versionadas preparam uma instalação nova. `prisma:migrate` cria novas migrations e deve ser reservado a alterações de schema em desenvolvimento. Para um banco antigo com tabelas existentes, consulte [baseline](implantacao.md#migrations-e-bancos-existentes).

O seed de conquistas cadastra os marcos iniciais. O seed opcional `npm run prisma:seed:activities` depende de já existir uma turma com professor e pode atualizar as atividades de exemplo dessa turma; use-o somente em ambiente de desenvolvimento.

## 3. Iniciar o frontend

Em outro terminal, a partir da raiz:

```bash
cd frontend
npm ci
npm run dev
```

Abra <http://localhost:5173>. O Swagger está em <http://localhost:3001/api/v1/docs>.

## 4. Criar o primeiro administrador

O cadastro público aceita alunos e professores. Cadastre uma conta e, com acesso autorizado ao banco, abra `npm run prisma:studio` no backend para alterar seu campo `role` na tabela `users` para `ADMIN`.

Também é possível executar SQL, substituindo o endereço pelo da conta criada:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Entre novamente na plataforma para renovar a sessão. As próximas operações administrativas podem ser feitas pelo painel.

## 5. Habilitar atividades de programação

O executor não é iniciado pelo servidor da API. Em uma máquina de desenvolvimento descartável com Docker ativo:

```bash
cd backend
npm run build:runner
npm run start:runner
```

O executor precisa acessar o mesmo banco da API. Em produção, use um host dedicado, conforme [implantação](implantacao.md#executor-de-codigo).

## Alternativa: Docker Compose

Na raiz, depois de configurar `backend/.env` e SMTP:

```bash
cp docker-compose.example.yml docker-compose.yml
docker compose up --build -d
```

No PowerShell, use `Copy-Item` para a cópia. Configure os endereços/CORS para a porta **3010**. O frontend estará em <http://localhost:3010> e a API em <http://localhost:3001>. O Compose principal não inicia o executor de código.

Na primeira instalação, execute o seed de conquistas:

```bash
docker compose exec api npm run prisma:seed:achievements
```

O frontend do Compose usa `VITE_API_URL` do ambiente do Compose, com padrão `http://localhost:3001`; ele não lê automaticamente `frontend/.env`. Para acessar por outro computador, use uma origem de API alcançável pelo navegador e reconstrua a imagem.
