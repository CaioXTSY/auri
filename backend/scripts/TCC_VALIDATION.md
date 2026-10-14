# Avaliação isolada da AURI

Execute a partir de `backend/`, com banco **local e descartável** cujo nome começa por `auri_tcc_`. Não reutilize `DATABASE_URL` de produção. Os scripts de avaliação recusam outros destinos; a configuração Jest também exige conexão explicitamente isolada.

```powershell
$env:DATABASE_URL = 'mysql://root@127.0.0.1:33307/auri_tcc_20261013'
node node_modules/prisma/build/index.js generate
node node_modules/prisma/build/index.js migrate deploy
npm.cmd test -- --runInBand
npm.cmd run test:e2e -- --runInBand
npm.cmd run lint
npm.cmd run build
npm.cmd run build:runner
```

O banco utilizado nesta auditoria foi uma instância MariaDB 10.4.32 com diretório de dados próprio no diretório temporário do usuário, sem acessar bancos existentes. MariaDB foi usada pela disponibilidade local; os resultados não equivalem a testar MySQL 8 sob carga.

## Chamadas pagas

O script seguinte utiliza a chave existente de `backend/.env` exclusivamente para as chamadas à OpenAI. A conexão de banco precisa vir da variável explícita acima. Nunca imprima a chave. Não há alunos reais no banco isolado.

```powershell
$env:OPENAI_REVIEW_MODEL = 'gpt-4.1-mini'
node -r ts-node/register scripts/evaluate-tcc-quizzes.ts
```

O script chama `QuizGeneratorService.generateEvaluationQuiz`, reutilizando prompt, validação, revisão assistida, embaralhamento e persistência da implementação principal. O limite é 40 solicitações por dificuldade, no máximo três tentativas por solicitação e três solicitações simultâneas. Retoma os resultados de `evidencias-tcc/quizzes-reais.json`; não execute dois processos de avaliação escrevendo esse arquivo ao mesmo tempo. Regenera conteúdo novo; reprodução do procedimento não garante os mesmos textos nem as mesmas posições aleatórias.

Cada questão salva fica `PENDING`. As chamadas são registradas individualmente em `openai-calls.jsonl`, incluindo modelo retornado, tokens, cache, request ID e resposta, sem cabeçalhos de autenticação. Os arquivos de questões contêm também as chamadas de cada tentativa. Custos devem ser estimados pelas tarifas verificadas e pelo uso retornado, nunca tratados como fatura do provedor.

## Revisão e publicação

Os quizzes diários são publicados automaticamente após validação estrutural, revisão assistida por IA e embaralhamento. Não exigem aprovação humana nem configuração de `QUIZ_REVIEW_MODE`; valores antigos dessa variável são ignorados pelo fluxo diário. Somente quizzes `APPROVED` são apresentados aos alunos. A aprovação automática não representa validação pedagógica.

O cron existente e a geração sob demanda usam o mesmo fluxo automático, limitado a três tentativas. Falhas ficam na auditoria sem criar quiz pendente. Conteúdos históricos pendentes/rejeitados permanecem bloqueados; se ocuparem a chave do dia, uma nova geração válida libera essa chave na mesma transação que publica a nova questão, preservando o conteúdo e seu estado antigo. Questões já publicadas continuam disponíveis. A tela administrativa mantém a auditoria e não exibe fila de aprovação. Os endpoints autorizados de revisão de registros históricos foram conservados por compatibilidade e não são utilizados na geração diária. O modo de avaliação isolada deste guia ainda salva `PENDING` para preservar o experimento sem publicar suas amostras.

## Execução de código e comparação

```powershell
# Se Docker estiver disponível diretamente no PATH, omita esta variável e o setup WSL.
$env:AURI_TCC_DOCKER_WSL = 'AURI-TCC-Judge'
node node_modules/jest/bin/jest.js --config test/jest-runner-integration.json --runInBand --setupFiles '<rootDir>/docker-wsl-bridge.cjs'
node -r ts-node/register scripts/execute-tcc-snippets.ts
node -r ts-node/register scripts/compare-tcc-baseline.ts
```

A adaptação WSL é exclusiva dos testes e não altera o executor em produção. A execução dos exemplos usa o `runDocker` real da AURI: sem rede e sem mounts do host, com usuário sem privilégios, filesystem somente leitura, memória/CPU/PIDs limitados e timeout. A classificação de resultados faz correspondência exata normalizada de saída ou tipo de erro; casos sem correspondência são inconclusivos, não automaticamente incorretos. Isso não comprova segurança contra todos os códigos maliciosos.

O comparador lê três serviços diretamente do commit inicial com `git show`, executa-os no banco isolado e compara com os serviços atuais. Não altera o checkout. Os callbacks de progressão são simulados apenas nesse comparador; a suíte de integração testa também os serviços completos.

## Frontend

Neste ambiente, o carregador padrão do Vite/esbuild apresentou restrição de acesso a diretórios. A compilação e a execução de testes foram feitas com o carregador nativo, preservando o código da aplicação:

```powershell
cd ../frontend
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build --configLoader native
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5173 --configLoader native
# Em outro terminal, com o preview em execução:
npm.cmd run test:e2e
```

Se o Chromium esperado não estiver instalado, instale-o com Playwright ou defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE` para um binário local verificado. O teste da fila de revisão usa respostas sintéticas; as permissões e a persistência reais são verificadas separadamente pelos testes de API.
