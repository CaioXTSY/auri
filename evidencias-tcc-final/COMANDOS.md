# Comandos da verificação final

Executados em 13/10/2026, America/Sao_Paulo (JSON usa UTC), pelo PowerShell. Saídas redirecionadas para esta pasta, preservando `$LASTEXITCODE`. Os arquivos de redirecionamento UTF-16LE foram convertidos para UTF-8; espaços finais de formatação e linhas vazias ao final dos logs foram removidos por `consolidar.cjs`. Mensagens/resultados foram mantidos. Todas as ferramentas vieram dos `node_modules` já instalados. Nenhuma instalação ou chamada OpenAI nova.

## Identidade e preservação (raiz)

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git diff --stat 090eb79 HEAD
rg --files -g AGENTS.md
Get-Content -Encoding UTF8 RELATORIO_VALIDACAO_TCC.md
Get-Content -Encoding UTF8 backend/scripts/TCC_VALIDATION.md
git diff -- backend/test/tcc-validation.e2e-spec.ts
git add -- backend/test/tcc-validation.e2e-spec.ts backend/test/final-smoke.e2e-spec.ts
git commit -m 'test: add final integrated TCC smoke and separate evidence output'
node evidencias-tcc-final/verificar-evidencias.cjs
node evidencias-tcc-final/consolidar.cjs
```

## Instância nova, local e descartável

```powershell
$taskData = Join-Path $env:TEMP 'auri-tcc-final-20261013/db'
# A execução recusou reutilizar este caminho caso já existisse.
New-Item -ItemType Directory -Path $taskData -Force
& 'C:/xampp/mysql/bin/mysql_install_db.exe' "--datadir=$taskData" --port=33308 --silent
& 'C:/xampp/mysql/bin/mysqld.exe' '--defaults-file=C:/Users/extas/AppData/Local/Temp/auri-tcc-final-20261013/db/my.ini' '--bind-address=127.0.0.1' '--port=33308' --console
# Em outra sessão:
& 'C:/xampp/mysql/bin/mysql.exe' --host=127.0.0.1 --port=33308 --user=root --execute='CREATE DATABASE auri_tcc_final_20261013'
```

## Backend (cwd backend)

```powershell
$env:DATABASE_URL='mysql://root@127.0.0.1:33308/auri_tcc_final_20261013'
$env:TCC_EVIDENCE_DIR='C:/Users/extas/OneDrive/Documentos/GitHub/auri/evidencias-tcc-final'
$env:JWT_SECRET='synthetic-final-test-secret'
$env:JWT_REFRESH_SECRET='synthetic-final-refresh-secret'
node node_modules/prisma/build/index.js generate
node node_modules/prisma/build/index.js validate
node node_modules/prisma/build/index.js migrate deploy
node node_modules/prisma/build/index.js migrate status
node node_modules/jest/bin/jest.js --runInBand --json --outputFile=../evidencias-tcc-final/unit.json
node node_modules/jest/bin/jest.js --config test/jest-e2e.json --runInBand --json --outputFile=../evidencias-tcc-final/api.json
$env:AURI_TCC_DOCKER_WSL='AURI-TCC-Judge'
node node_modules/jest/bin/jest.js --config test/jest-runner-integration.json --runInBand --setupFiles '<rootDir>/docker-wsl-bridge.cjs' --json --outputFile=../evidencias-tcc-final/docker.json
npm.cmd run build
npm.cmd run build:runner
npm.cmd run lint
# Primeiro teste adicional: evidências preservadas como smoke-inicial.* (uma expectativa incorreta de HTTP).
node node_modules/jest/bin/jest.js --config test/jest-e2e.json --runInBand --testPathPattern=final-smoke --json --outputFile=../evidencias-tcc-final/smoke.json
node node_modules/prettier/bin/prettier.cjs --write test/final-smoke.e2e-spec.ts test/tcc-validation.e2e-spec.ts
# Após corrigir a expectativa 403 para o contrato 404 e criar o commit de testes:
node node_modules/jest/bin/jest.js --config test/jest-e2e.json --runInBand --json --outputFile=../evidencias-tcc-final/api-final.json
npm.cmd run lint
```

`assert-isolated-db.cjs`, já existente, exige explicitamente banco local `auri_tcc_*` e define `QUIZ_GENERATION_ENABLED=false` antes de carregar a aplicação. SMTP é mockado nas suítes de API; os serviços de negócio e o banco são reais. As variáveis acima não alteram `.env`.

## Frontend (cwd frontend)

```powershell
npm.cmd run build
# Falhou no esbuild por Access is denied; saída preservada.
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build --configLoader native
npm.cmd run lint
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5173 --configLoader native
# Em outra sessão:
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE='C:/Users/extas/AppData/Local/ms-playwright/auri-tcc-chromium-1208-1791741282061/chrome-win64/chrome.exe'
node node_modules/@playwright/test/cli.js test --reporter=json
```

O JSON do navegador foi salvo em `browser.json`. Preview já ativo foi reutilizado pelo Playwright; APIs de navegador são sintéticas.

## Conferência de ambiente e encerramento (raiz)

```powershell
& 'C:/xampp/mysql/bin/mysql.exe' --host=127.0.0.1 --port=33308 --user=root --database=auri_tcc_final_20261013 --batch --execute='SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at'
wsl.exe -d AURI-TCC-Judge -- docker version --format '{{.Server.Version}}'
wsl.exe -d AURI-TCC-Judge -- docker image inspect node:20-alpine python:3.12-alpine --format '{{json .RepoDigests}}'
& 'C:/xampp/mysql/bin/mysqladmin.exe' --host=127.0.0.1 --port=33308 --user=root shutdown
# Ctrl+C na sessão do preview. Instância MariaDB terminou normalmente.
git diff --check
git diff --name-only 98f7ff3 -- RELATORIO_VALIDACAO_TCC.md evidencias-tcc
git status --short
```

Não foram executados nesta etapa `evaluate-tcc-quizzes.ts`, `execute-tcc-snippets.ts`, `summarize-tcc-evidence.ts`, `quarantine-tcc-findings.ts` ou o comparador antigo: escrevem evidências/banco da campanha anterior ou geram chamadas pagas. Seus registros foram lidos e corroborados independentemente.
