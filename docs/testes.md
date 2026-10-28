# Testes e verificação

Cada aplicação mantém seus próprios `package.json` e `package-lock.json`. Execute `npm ci` em cada diretório antes das verificações.

## Backend

```bash
cd backend
npm run prisma:generate
npm run lint
npm run build
npm test -- --runInBand
npm run build:runner
```

Os testes unitários usam serviços simulados. Incluem autenticação, operações de turmas, atividades, usuários, dashboard, geração de quiz, programação, worker, CORS e healthcheck. Não precisam de MySQL ou chamadas reais à OpenAI.

### Testes HTTP com MySQL

Os testes `test/auth.e2e-spec.ts` e `test/users.e2e-spec.ts` inicializam a aplicação e acessam o banco. **Use um banco exclusivo de testes**, aplique as migrations e defina `DATABASE_URL` para ele. Esses testes criam e removem registros. O envio de e-mail é simulado e não requer SMTP externo.

Exemplo no PowerShell, a partir do backend, depois de criar o banco:

```powershell
$env:NODE_ENV = 'test'
$env:DATABASE_URL = 'mysql://USUARIO:SENHA@localhost:3306/auri_test'
$env:JWT_SECRET = 'local-test-access-secret'
$env:JWT_REFRESH_SECRET = 'local-test-refresh-secret'
npm run prisma:migrate:deploy
npm run test:e2e -- --runInBand
```

Em Bash, defina as mesmas variáveis com `export`. As variáveis do processo prevalecem sobre o `.env`. Feche o terminal de testes antes de voltar a operar outro banco. O CI provisiona um MySQL descartável para esta etapa.

### Integração do executor

```bash
cd backend
npm run test:runner:integration
```

Requer Docker Engine ativo e acesso às imagens configuradas para JavaScript e Python. Verifica execução, timeout, rede desligada e filesystem somente leitura. Não é executado pelo CI padrão. `npm run test:runner` executa somente os testes unitários do worker, já incluídos em `npm test`.

## Frontend

```bash
cd frontend
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

O Playwright inicia o Vite na porta 5173. Não deixe outra aplicação nessa porta. São verificados navegação pública, teclado, viewport estreita, estados do painel do professor e ausência de violações críticas/graves nas verificações axe presentes nos testes. O painel utiliza respostas simuladas da API; não é um teste completo com banco e backend.

`npm run test:a11y` executa somente `accessibility.spec.ts`, que já integra o conjunto completo. Relatórios, traces e prints gerados ficam ignorados pelo Git.

### Carregamento de configuração no Windows

Se o esbuild não conseguir ler a configuração em um diretório protegido ou sincronizado, tente o carregador alternativo do Vite:

```bash
npm run build -- --configLoader runner
npm run dev -- --configLoader runner
```

Isso modifica somente a forma de carregar a configuração. Se a falha de acesso persistir, use uma cópia de trabalho em um diretório acessível.

## Integração contínua

O [CI](../.github/workflows/ci.yml) verifica backend, frontend e Playwright em pushes e pull requests. As verificações não representam cobertura integral dos requisitos nem comprovam eficácia pedagógica. Para registrar uma avaliação no TCC, vincule o resultado ao cenário e à evidência correspondente; a existência de um teste não prova que ele foi aprovado.
