# Implantação

## API, frontend e banco

O [Compose de exemplo](../docker-compose.example.yml) reúne MySQL, API e frontend. Aplica migrations antes da API, utiliza healthchecks e preserva banco e uploads em volumes. Adapte URLs, SMTP, credenciais e acesso à rede antes de usar um ambiente compartilhado.

Os Dockerfiles usam a raiz do repositório como contexto:

```bash
docker build -f backend/Dockerfile --target production -t auri-api .
docker build -f frontend/Dockerfile --build-arg VITE_API_URL=https://api.example.com -t auri-frontend .
```

O `.dockerignore` da raiz exclui arquivos de ambiente, dados de usuários, dependências locais e relatórios desse contexto. Credenciais são fornecidas na execução. `VITE_API_URL` é público e definido no build do frontend.

Antes de disponibilizar a aplicação:

- Configure TLS, origens CORS explícitas e endereços públicos de frontend/API.
- Use senhas e segredos JWT próprios para o ambiente.
- Configure SMTP e remetente.
- Cadastre o administrador e execute o seed de conquistas em uma instalação nova.
- Preserve banco, uploads públicos e privados, com backups e recuperação verificada.

O exemplo de ambiente mantém `NODE_ENV=development`. Em produção, altere para `production`; o cookie de renovação passa a exigir HTTPS.

## Migrations e bancos existentes

Em um banco novo, execute `npm run prisma:migrate:deploy`. Para um banco AURI antigo criado antes das migrations, compare seu schema com a migration inicial antes de registrar a baseline. Faça backup e valide o procedimento em uma cópia.

Somente se o schema já corresponder à migration inicial:

```bash
cd backend
npx prisma migrate resolve --applied 20260921000000_initial_schema
npm run prisma:migrate:deploy
```

Não registre a baseline em banco vazio, não marque migrations adicionais sem verificar o schema e não use `prisma migrate reset` em produção.

## Executor de código

O worker executa código enviado por usuários e controla o Docker. Em produção, opere-o em uma VM/host dedicado, separado de API, banco, frontend e outros dados sensíveis. Os limites dos contêineres não eliminam a necessidade dessa separação.

No host dedicado, configure somente a conexão ao banco e os parâmetros do worker. O [Compose do runner](../docker-compose.runner.example.yml) usa `backend/.env`; nesse host, não copie chaves JWT, SMTP ou OpenAI desnecessárias.

```bash
cp docker-compose.runner.example.yml docker-compose.runner.yml
docker compose -f docker-compose.runner.yml up --build -d
```

O runner recebe o socket Docker. As submissões usam rede desabilitada, filesystem raiz somente leitura, limites de CPU/memória/PIDs e remoção de capabilities. As imagens são configuradas por `CODE_RUNNER_JS_IMAGE` e `CODE_RUNNER_PY_IMAGE`; mantenha-as atualizadas e verifique os testes de integração ao trocá-las.

## IA e observabilidade

O quiz diário depende de `OPENAI_API_KEY` e do modelo em `OPENAI_MODEL`. São registrados prompt/resposta aprovados e, quando disponíveis, tokens, tentativas e validações agregados das chamadas que produziram o quiz. Métricas indisponíveis ficam nulas. A consulta administrativa não mantém tabela de preços.

Esses registros podem conter informações do ambiente e não devem ser exportados para issues públicas. O endpoint `/api/v1/health` verifica também a conexão com o banco.

## Deploy por GitHub Actions

O workflow [Deploy Prod](../.github/workflows/deploy.yml) é específico do ambiente do mantenedor e executa a cada push na branch `main`. Depende do secret `SSH_CONFIG` e do script `auri_deploy.sh` já instalado no servidor; o script não é distribuído neste repositório.

Clonar o projeto ou torná-lo público não configura esse servidor. Quem fizer um fork deve desabilitar ou substituir o workflow antes de configurar credenciais. No repositório original, revise os checks antes de atualizar `main`, pois o deploy atual não aguarda o resultado do CI.
