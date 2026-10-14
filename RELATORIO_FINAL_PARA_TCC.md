# AURI — Relatório final para o TCC

Verificação de **13 de outubro de 2026**, America/Sao_Paulo; registros ISO das ferramentas em UTC. Documento complementar: preserva integralmente `RELATORIO_VALIDACAO_TCC.md` e `evidencias-tcc/`. O Google Docs não foi alterado.

**Resultado:** os **141 testes anteriores passaram novamente**, e um novo teste integrado passou, totalizando **142/142** na execução final. Não foi encontrado defeito adicional da aplicação nos cenários executados. Backend, worker e frontend com carregador nativo compilaram. O comando padrão de build do frontend continua falhando neste host. Não houve nova geração paga de quizzes, push, deploy ou acesso a banco de produção.

## Identificação da versão e ambiente

| Item | Registro verificável |
|---|---|
| Branch inicial/final | `main` |
| HEAD inicial | `98f7ff3edafc6c9fb1aa263f49dd1f0f7a53b372` |
| Estado inicial | Git limpo; nenhuma modificação preexistente |
| Código da auditoria anterior | `090eb79d018261abadd904f2beec44b29b0e6ecb` |
| Commit final de código/testes desta etapa | **`e7232418923d5f5bf61ba3615b27bdca2c950d71`** |
| Diferença de produção em relação a `090eb79` | Nenhuma em backend/src, backend/prisma, frontend/src e configurações Vite/Playwright |
| Alterações de código nesta etapa | Novo `backend/test/final-smoke.e2e-spec.ts`; destino configurável por `TCC_EVIDENCE_DIR` no gravador de evidência de `tcc-validation.e2e-spec.ts` |
| Documentação/evidências novas | Este relatório e `evidencias-tcc-final/`; commit documental posterior não altera o código avaliado |
| Node / Nest / Prisma client e CLI / Jest | 26.4.0 / 11.1.28 / 5.22.0 / 29.7.0 |
| React / Vite / TypeScript / Playwright | 19.2.4 / 7.3.6 / 5.9.3 / 1.58.1 |
| SDK OpenAI instalado | 4.104.0; o gerador efetivo usa HTTP `fetch` |
| Banco efetivamente usado | MariaDB 10.4.32, `127.0.0.1:33308`, `auri_tcc_final_20261013` |
| Diretório do banco | `C:/Users/extas/AppData/Local/Temp/auri-tcc-final-20261013/db`, criado vazio nesta etapa |
| Executor Docker | WSL `AURI-TCC-Judge`, Docker 29.9.0; mesmos digests das imagens da auditoria anterior |

O HEAD inicial continha somente documentação/evidências adicionais sobre o código `090eb79`. A comparação dos 275 hashes antigos encontrou alteração apenas no gravador do teste, feita nesta etapa; o novo manifesto abrange 276 arquivos. Os 30 arquivos históricos, incluindo o relatório, conservaram os bytes e hashes. Evidências: [identidade e preservação](evidencias-tcc-final/versao-avaliada.json), [fontes atuais](evidencias-tcc-final/fontes-testadas-sha256.json).

As suítes unitária, Docker e navegador foram executadas antes do commit de testes, sobre fontes de produção e casos dessas suítes idênticos aos do commit final. A execução final de API já incluiu os dois arquivos de teste commitados. Essa proveniência consta em [testes finais](evidencias-tcc-final/testes-final.json). O commit que adiciona este relatório e suas evidências pode ser identificado por `git log -1 --format='%H %s' -- RELATORIO_FINAL_PARA_TCC.md`; ele é documental, não uma nova versão dos serviços. Após esse commit, o checkout foi conferido limpo.

## A. Situação final da implementação

A implementação integra frontend React, API NestJS, persistência Prisma, worker de execução de código em Docker, atividades acadêmicas, gamificação, mural, notificações e geração/revisão de quizzes. O alcance efetivamente exercitado é:

| Fluxo | Evidência desta etapa | Limite da afirmação |
|---|---|---|
| Autenticação e perfis | API existente verifica registro, login, refresh, erros e recuperação com SMTP mock; novo smoke faz quatro logins reais de usuários sintéticos e exige 401/403 no acesso administrativo | Não confirma entrega de e-mail externo nem todos os ataques possíveis |
| Turmas e matrícula | Smoke cria turma via API, solicita entrada, confirma ausência de matrícula enquanto pendente, aprova e confirma persistência | Uma configuração de aprovação; testes não exaustivos das configurações |
| Publicar, entregar e corrigir | Smoke publica atividade TEXT, aluno entrega, professor corrige e recorrege; consulta banco/XP | Upload/download e todas as modalidades não têm percurso completo de navegador nesta etapa |
| Avaliação de código | Cinco testes executam Docker real; testes unitários exercitam worker/submissões/atividades de programação | Não houve uma submissão percorrendo navegador → API → polling do worker → Docker → feedback numa única execução integrada |
| Gamificação | API/banco real confirma pontos, rankings, conquistas, streak, concorrência e persistência | Programação usa submissões/nota final sintéticas no teste da recompensa; níveis não têm análise exaustiva de concorrência |
| Mural/notificações | Smoke cria post de professor, aluno matriculado lê, aluno externo é recusado; notificação é listada e marcada como lida | Não exercita todas as operações de edição/moderação/respostas nem entrega Socket.IO a um cliente |
| Quizzes | Testes determinísticos do gerador/qualidade, API de revisão/autorização/persistência e interface com respostas sintéticas | Nenhuma chamada OpenAI nova; disponibilidade atual do provedor não foi retestada |
| Administração | Smoke compara estatísticas retornadas com contagens reais; API verifica revisão por responsável/admin | Não cobre todas as operações administrativas |

O smoke usa API NestJS, JWT gerado pelo login, serviços e banco reais, com usuários sintéticos. SMTP é mockado e geração real é desabilitada. Os sete testes de navegador exercitam páginas públicas, acessibilidade e fila de revisão com APIs sintéticas; não são uma validação completa do sistema ponta a ponta. Fontes: [smoke](backend/test/final-smoke.e2e-spec.ts), [resultados coletados](evidencias-tcc-final/smoke-resultados.json), [API](evidencias-tcc-final/api-final.json), [navegador](evidencias-tcc-final/browser.json).

## B. Correções confirmadas

| Correção integrada na branch principal | Arquivos relevantes | Verificação |
|---|---|---|
| XP e rankings convergem; somente ALUNO participa da classificação, inclusive zero XP; desempate por ID; remoção de matrícula obsoleta | `gamification/gamification.service.ts`, `ranking.service.ts` | Teste TCC: 475→480→485 nos três indicadores; 103 alunos; funcionários excluídos; IDs persistentes e remoção de desmatriculado |
| Créditos identificados não duplicam ao repetir/concorrer; conquista e XP atômicos | `reward-store.ts`, `points.service.ts`, `achievements.service.ts`, schema | Duas conclusões/respostas simultâneas; conquista de 30 e streak de 50 uma vez; rollback de 99 não altera saldo |
| Nota acadêmica concede XP uma vez | `activities/activities.service.ts` | Duas correções simultâneas totalizam 100 XP; smoke recorrege 80→90 mantendo 25 XP de recompensa |
| Programação concede diferença positiva sobre o já creditado | `programming/programming-gamification.service.ts` | Nota 70 concorrente concede 70 e 0; melhora a 100 concede 30; reprocessar concede 0 |
| Contagem de alunos exclui proprietário, administrador e matrícula pendente | `classes/classes.service.ts`, `admin/admin.service.ts`, `ClassWorkspace.tsx`, `TeacherUnifiedActivitySubmissions.tsx` | Um aluno e dois participantes; matrícula histórica de funcionário excluída; smoke distingue solicitação e matrícula |
| Quiz não pode ser concluído sem responder nem acessado pendente/futuro | `mission-quiz.service.ts`, `missions.service.ts` | Recusa bypass/índice fracionário/futuro; pendente inacessível; aprovação libera acesso |
| JSON/índice/dificuldade/opções validados; alternativas, explicações e chave permutadas juntas | `quiz-quality.ts`, prompt, `quiz-generator.service.ts` | Regressões de JSON, índice nulo, duplicatas e divergência de dificuldade; todas as 24 permutações; palavras “alternativa” e “opção” |
| Revisão, auditoria e modos de publicação explícitos | `quiz-review.service.ts`, generator, controller/DTO, `QuizReviewQueue.tsx` | Estados/ator/data/justificativa persistidos; aluno/professor alheio recusados; uma diária entre dois geradores; modo automático explicitamente testado com geração simulada |

Fontes dos casos: [teste TCC de API](backend/test/tcc-validation.e2e-spec.ts), [testes unitários executados](evidencias-tcc-final/unit.json) e [sondagens numéricas](evidencias-tcc-final/integracao-resultados.json). A mudança desta etapa no gravador evita sobrescrever os resultados anteriores; não altera lógica/assertions desse teste. Não foram reestruturados serviços nem enfraquecidas verificações.

Regras preservadas: XP individual é a soma do ledger; ranking da turma usa o **XP global de seus alunos**, não XP restrito à turma. Nível usa `floor(sqrt(XP/100))`. Créditos administrativos sem referência podem se repetir legitimamente. A idempotência não corrige retroativamente créditos históricos eventualmente duplicados.

## C. Resultados dos testes

| Grupo | Executados | Aprovados | Reprovados finais | Não executados |
|---|---:|---:|---:|---:|
| Unitários Jest | 84 | 84 | 0 | 0 |
| API/banco, incluindo smoke adicional | 46 | 46 | 0 | 0 |
| Docker real | 5 | 5 | 0 | 0 |
| Navegador Playwright | 7 | 7 | 0 | 0 |
| **Total de casos finais** | **142** | **142** | **0** | **0** |

A diferença de 141 para 142 é **um novo caso integrado**; seus 12 valores coletados/assertions não são contados como 12 testes. A suíte TCC registra outras 28 sondagens numéricas. Reexecuções não são somadas artificialmente: a primeira execução da API teve 45/45; a execução final teve 46/46. O primeiro smoke falhou porque sua nova assertion esperava 403 onde o contrato existente devolve 404 para ocultar a atividade de um não matriculado. Ajustou-se somente essa expectativa; o bloqueio de acesso continua exigido. Falha inicial preservada em [JSON](evidencias-tcc-final/smoke-inicial.json) e [log](evidencias-tcc-final/smoke-inicial.txt). Não era defeito do serviço.

“Não executados = 0” refere-se aos casos declarados nessas suítes. Não significa cobertura de todos os requisitos; os percursos não exercitados estão em A/E. Evidência por caso e contagens das ferramentas: [consolidação](evidencias-tcc-final/testes-final.json).

| Cenário | Esperado | Observado nesta execução |
|---|---|---|
| Alunos/participantes/proprietários | 1 / 2 / 1 | 1 / 2 / 1 |
| XP individual/global/turma, base sintética | 475 / 475 / 475 | 475 / 475 / 475 |
| Missão de +5 | 480 / 480 / 480 | 480 / 480 / 480 |
| Resposta errada | Sem XP da missão; saldo 480 | 480 |
| Quiz correto de +5 | 485 / 485 / 485 | 485 / 485 / 485 |
| Concorrência de conclusão e resposta | Uma aceita/uma recusada em cada caso | 201 e 400; sem duplicação |
| Conquista concorrente | Um desbloqueio/crédito; XP 515 | 1 / 1 / 515; ranking turma 515 |
| Rollback de 99 | Preservar 515 | 515 |
| Bônus simultâneo sete dias | Streak 7; um crédito de 50; XP 565 | 7 / 1 / 565 |
| Correções acadêmicas concorrentes | 100 XP; um crédito; xpAwarded 100 | 100 / 1 / 100 |
| Programação nota 70 simultânea | Um crédito 70, outro 0 | [0,70], ordem variável |
| Melhora para 100 / reprocessamento | +30 / +0 | +30 / +0 |
| Atividade + programação da segunda fixture | 200 XP | 200 |
| Ranking >100 alunos | 103; posições contíguas; funcionários excluídos | 103; predicados satisfeitos |
| Dois geradores no mesmo dia, conteúdo simulado | Uma missão PENDING | 1 / PENDING |
| Modo automático explícito, conteúdo simulado | APPROVED, sem revisor humano | APPROVED / reviewedById nulo |
| Revisão sintética autorizada | Estado/ator/data; acesso liberado | Persistidos e verificados |
| Revisão/acesso indevidos | Aluno e professor alheio 403; pendente 404 | Recusados conforme assertions |
| Smoke matrícula pendente→aprovada | 0→1 matrícula | 0→1 |
| Smoke atividade | DRAFT→PUBLISHED→SUBMITTED→GRADED, nota 80, XP 25 | Todos os estados; recorreção a 90 mantém +25 |
| Smoke post/notificação/admin | Post legível pelo matriculado, notificação persistida/lida, estatísticas iguais ao banco | Todos verificados; classes 1 / posts 1 |
| Embaralhamento determinístico | 24 permutações preservando pares/chave | 24; nenhuma falha |

475 é saldo inserido artificialmente na fixture; não representa reexecução das recompensas históricas. Resposta errada concede zero pela missão, mas não comprova ausência de bônus de toda conquista configurável. O critério existente `FIRST_QUIZ_COMPLETED` considera tentativas, não só acertos; não aparece no seed examinado e não foi redefinido.

### Compilação, tipos, lint e Prisma

| Comando/verificação | Resultado e evidência |
|---|---|
| Backend `npm run build` | Passou; [log](evidencias-tcc-final/build-backend.txt) |
| Worker `npm run build:runner` | Passou; [log](evidencias-tcc-final/build-runner.txt) |
| Frontend `tsc -b` | Passou; log vazio e saída 0 registrados na consolidação |
| Frontend `npm run build` padrão | **Falhou**, saída 1, esbuild “Cannot read directory: Access is denied”; [log](evidencias-tcc-final/build-frontend-default.txt) |
| Frontend Vite `build --configLoader native` | Passou sem mudar configurações; [log](evidencias-tcc-final/build-frontend-native.txt) |
| Lint backend após novo teste | Zero erros, **21 avisos**; [log](evidencias-tcc-final/lint-backend-final.txt) |
| Lint frontend | Passou; [log](evidencias-tcc-final/lint-frontend.txt) |
| Prisma generate / validate | Passaram; [generate](evidencias-tcc-final/prisma-generate.txt), [validate](evidencias-tcc-final/prisma-validate.txt) |
| Migrações no banco vazio | **Três aplicadas**, sem pendências; [deploy](evidencias-tcc-final/migrations-deploy.txt), [status](evidencias-tcc-final/migrations-status.txt) |

O navegador usou preview compilado com carregador nativo e o Chromium local já existente. Os logs mostram avisos de ferramentas Node e do build de dependências, sem reprovação das respectivas suítes. A instância MariaDB registrou avisos “Aborted connection ... Got an error reading communication packets” durante encerramentos de conexões; os testes e consultas finalizaram com sucesso e o servidor teve shutdown normal. Não foi diagnosticada a causa desses avisos. Não houve exclusão de suites ou alteração de configuração para esconder falhas.

### BOM e histórico de migrações

A comparação binária dos blobs Git confirmou que `20260921000000_initial_schema/migration.sql` mudou **somente pela remoção dos três bytes do BOM UTF-8** entre o baseline e `090eb79`. SHA-256 do blob antigo: `6515c7e601d7f264b0f710499055bcd96104b2ac12b50bc07246d7b7aaccce59`; do corrigido: `f83cb0db153badfc5bef3ae0306da5cc5757fb66710b4704f71d58ceefd187eb`.

No Windows, o arquivo físico tem CRLF e SHA-256 `17ae39d4f1ef66f70d39326d425da05d34854150de75ff9e5aab24e49ce4a39e`, exatamente o checksum gravado na nova `_prisma_migrations`. A diferença de finais de linha explica por que o hash físico difere do blob Git; não se deve comparar instalações sem considerar os bytes realmente aplicados. Evidências: [comparação BOM](evidencias-tcc-final/versao-avaliada.json), [checksums do banco novo](evidencias-tcc-final/migrations-checksums.txt).

**Instalações que já registraram a migração com outros bytes podem ter checksum divergente.** O sucesso de `migrate status` neste banco novo não comprova compatibilidade de um histórico antigo. Não se simulou reconciliação nem se alterou `_prisma_migrations` de instalações existentes. Antes de atualizar uma instalação antiga, comparar seu histórico e os arquivos aplicados, preservando backup; não apagar/resetar seu histórico para obter resultado positivo. Para a demonstração com banco novo, as três migrações passaram.

## D. Avaliação da geração de quizzes

Esta etapa **corroborou arquivos preservados**, usando o validador atual, prompts/respostas brutos, CSV de estados e registros de execução. Não gerou amostra nova, não reabriu o banco antigo e não fez novo round trip dos 120 registros. Os round trips 60/60 e auditorias 92/92 são resultados históricos conservados, não medições repetidas agora. Procedimento: [verificador independente](evidencias-tcc-final/verificar-evidencias.cjs); resultados: [corroboração](evidencias-tcc-final/corroboracao-historica.json).

| Medida | Etapa preliminar | Amostra posterior |
|---|---:|---:|
| Solicitações | 72 | 92 |
| Quizzes salvos, uma questão cada | 60 | 60 |
| Chamadas registradas, incluindo revisão | 214 | 257 |
| Chamadas com uso conhecido | 213 | 257 |
| Gabaritos finais A/B/C/D | 16 / 11 / 17 / 16 | **17 / 12 / 17 / 14** |
| Dificuldades solicitadas/persistidas | 20 FACIL / 20 MEDIO / 20 DIFICIL | 20 FACIL / 20 MEDIO / 20 DIFICIL |
| Custo conhecido estimado USD | 0,05022660 | **0,09379420** |

Foram 120 quizzes salvos por chamadas **reais à OpenAI** na auditoria anterior. As 471 chamadas incluem uma sem uso conhecido; 470 têm uso. Geração retornou `gpt-4o-mini-2024-07-18`; revisão preliminar usou o mesmo modelo e revisão posterior retornou `gpt-4.1-mini-2025-04-14`. Testes com geração simulada não entram nesses totais.

Nos mesmos 60 quizzes posteriores, os gabaritos antes do embaralhamento eram 30/21/7/2; depois, 17/12/17/14 (28,33% / 20% / 28,33% / 23,33%). A reconferência confirmou **60/60 pares alternativa–explicação e 60/60 conteúdos da resposta proposta preservados**. Isso confirma o mapeamento do embaralhamento, não a correção semântica da resposta/explicação. Não houve imposição de cotas de 25%.

Os 60 registros posteriores passam na estrutura e têm dificuldade solicitada=retornada=persistida. A avaliação exploratória do revisor de IA diverge em **30/60**: FACIL→20 FACIL; MEDIO→10 FACIL e 10 MEDIO; DIFICIL→16 FACIL e quatro MEDIO. Nenhuma questão posterior foi estimada DIFICIL pelo revisor. Ele recebe dificuldade e explicações, podendo sofrer ancoragem; não é uma avaliação pedagógica independente.

Os registros históricos de execução Docker contêm 60 execuções posteriores: 26 correspondências exatas de saída/gabarito e 34 inconclusivos. A inspeção técnica assistida por IA desses registros identificou **seis inconsistências** que passaram pelo revisor de IA:

| Prefixo do ID | Saída/comportamento registrado | Problema preservado |
|---|---|---|
| `7f3d1668` | `1010101010` | Chave alegava TypeError; nenhuma opção com saída correta |
| `58c09147` | `50 5555555555` | Chave alegava TypeError; opções/explicações inadequadas |
| `e8aa8278` | `40.0` | Chave `20.0`; explicação usa divisor ausente |
| `5967b803` | `OACAMARGORP` | Chave `OACIMARGORP`; também referências posicionais |
| `7898d568` | `10`, sem erro | Enunciado pressupõe erro e chave especula overflow para outra entrada |
| `f630bc71` | `10.0` | Chave `15.0`, embora haja opção `10.0` |

Também se confirmaram sete registros com referências posicionais e uma duplicata normalizada. Com uma sobreposição, a união é **13 AUTO_REJECTED e 47 PENDING** no CSV/decisões arquivados. Os conteúdos originais foram conservados. **Zero aprovações humanas, zero pareceres pedagógicos humanos** sobre a amostra; os 47 pendentes não estão validados. Fontes: [decisões](evidencias-tcc/revisao-tecnica-pos-geracao.json), [execuções](evidencias-tcc/quizzes-reais-execucao.json), [estados](evidencias-tcc/amostra-final.csv).

O mecanismo de revisão humana está implementado e testado com atores sintéticos: `human` é padrão, responsável/admin aprova ou rejeita com justificativa e auditoria; alunos recebem somente conteúdo aprovado. O modo `automatic` exige configuração explícita e não representa parecer humano. Conteúdos legados continuam aprovados por compatibilidade, sem comprovar decisão humana. Não há regeneração automática após rejeição nem garantia de unicidade semântica global.

Custo conhecido das etapas: **US$ 0,14402080**; posterior por questão salva: **US$ 0,00156324**, incluindo tentativas rejeitadas com uso disponível. Soma conhecida: 492.107 tokens de entrada, 101.362 de saída e 150.656 de entrada em cache. Foram reutilizadas as tarifas históricas já documentadas, não uma nova cotação. O valor é **estimativa e limite inferior**, não fatura: uma tentativa não retornou uso e uma interrupção inicial pode ter deixado chamadas sem registro durável. Nesta verificação, chamadas OpenAI novas=0 e consumo adicional dessa API=0.

Proveniência: a amostra foi gerada durante alterações iterativas; as últimas regras de “opção” e repetição vieram após a inspeção. Ela foi reexaminada com o código final, mas não é campanha prospectiva congelada em `090eb79`. Os dez quizzes históricos descritos no TCC (A/MEDIO) não tiveram arquivos completos recuperados; a descrição antiga não é convertida em observação nova. Comparações entre amostras diferentes não sustentam causalidade ou aprendizagem.

## E. Limitações

- Não houve avaliação pedagógica por professores, estudo com estudantes, mensuração de aprendizagem/motivação ou usabilidade com participantes reais.
- Não se comprovou qualidade dos 47 pendentes; concordância entre modelos falhou em seis casos. Heurísticas podem apresentar falsos positivos/negativos e não garantem ausência de ambiguidades, pistas ou repetição semântica.
- A cobertura funcional é parcial. Não foi medido percentual de cobertura nesta etapa; testes aprovados não equivalem a todos os requisitos satisfeitos. SMTP e APIs do navegador são simulados; entrega Socket.IO, uploads e cadeia completa de submissão/worker não foram validados ponta a ponta.
- MariaDB 10.4.32 foi testada; não MySQL 8 em produção. Migrações passaram em banco novo; compatibilidade de históricos antigos e reparo de XP legado não foram executados.
- Não houve testes de carga, pentest, prova de isolamento contra todo código malicioso, escalabilidade do lock/reconstrução de rankings nem análise exaustiva de concorrência de níveis ou falhas distribuídas.
- Permanece falha do build padrão Vite/esbuild neste host; build nativo/preview passam. Backend conserva 21 avisos de lint. Avisos de conexões MariaDB não tiveram investigação causal.
- Disponibilidade/credenciais atuais da OpenAI e SMTP, deploy e topologia de produção não foram testados. A geração real e custos são evidências históricas, com limites de amostragem/proveniência/contabilidade explícitos.

## F. Sugestões factuais para atualizar o TCC

As correções abaixo referem-se à descrição histórica recuperada na auditoria e a afirmações que devem ser ajustadas **caso constem no texto**. Esta etapa não releu nem modificou o documento remoto e não atribui frases novas a ele.

| Seção | Fatos sustentados para incorporar | Informação antiga/afirmação a corrigir |
|---|---|---|
| **4.5.5 — Gamificação** | Ledger de XP; transações/lock/idempotência; rankings ALUNO; XP global dos matriculados; contagem aluno≠participante | Divergência 480/475 deixou de ocorrer na fixture corrigida; professor não conta como aluno; ranking de turma não mede só XP daquela turma |
| **4.5.7 — IA** | JSON Schema/validação, três dificuldades, revisão assistida, permutação conjunta, auditoria por chamada, revisão humana padrão e modo automático explícito | Descrição de publicação automática irrestrita não caracteriza o padrão atual; revisão de IA não é garantia de gabarito/dificuldade |
| **5.1 — Resultados da plataforma** | Plataforma integrada implementada; 142 casos finais e builds com ressalva do Vite; smoke real de API/banco cobrindo múltiplos módulos | Evitar “todos os fluxos/requisitos validados” e efeitos educacionais demonstrados; separar implementação de eficácia |
| **5.2 — Avaliação funcional** | 84 unitários, 46 API, cinco Docker, sete navegador; valores 475→480→485; concorrência/idempotência; novo smoke | Atualizar 141 para 142 explicando o acréscimo; identificar base 475 sintética, mocks e ausência de ponta a ponta completo |
| **5.3 — Atividades de programação** | Docker real executa JS/Python, timeout, bloqueio de rede e filesystem somente leitura; recompensa 70→100 concede +30 e repetição 0 | Não tratar submissões finais sintéticas do teste de XP como julgamento completo do worker; não afirmar segurança absoluta ou carga/escalabilidade |
| **5.4 — Quizzes IA** | Separar preliminar60/posterior60, chamadas reais históricas, gabaritos17/12/17/14, integridade60/60, seis erros,13 bloqueios,47 pendências,30 divergências exploratórias, custos estimados | Dez históricos A/MEDIO não resumem amostra atual; 20 rótulos DIFICIL não são 20 difíceis comprovados; pendentes não são aprovados; custos não são fatura |
| **5.5 — Discussão** | Consistência de dados e controle de publicação funcionaram nos testes; revisão de IA falhou em seis casos; mapeamento correto não assegura conteúdo correto | Equilíbrio de letras não demonstra qualidade pedagógica nem aprendizagem; não fazer comparação causal de amostras distintas |
| **6.1 — Considerações finais** | Objetivo de desenvolvimento de plataforma integrada apoiado pela implementação e verificações delimitadas | Separar entrega de software de prova de melhoria de ensino/aprendizagem; evitar cobertura/segurança universais |
| **6.2 — Limitações** | Ausência de humanos, cobertura parcial/mocks, MariaDB, build padrão, checksum antigo, amostragem iterativa e custos incompletos | Retirar alegações de validação humana/pedagógica, usuários reais, produção/MySQL8/carga se não houver evidências específicas externas |
| **6.3 — Trabalhos futuros** | Avaliação docente com rubrica, estudo com alunos, testes integrados/de carga, revisão de dificuldade/conteúdo e ambientes de implantação | Apresentar como propostas futuras, não capacidades/efeitos já comprovados; não são exigências para encerrar esta verificação |

## G. Pendências relevantes para a defesa

| Classificação | Pendência comprovada e ação proporcional |
|---|---|
| **Impeditiva para a demonstração, se usar o comando padrão neste host** | `npm run build` falha no esbuild. Para esta máquina, usar o build nativo e preview já verificados, preparando-os antes da apresentação. Não há impedimento comprovado para o preview compilado. |
| **Impeditiva para mostrar quiz diário gerado, se estiver pendente/rejeitado** | O sistema corretamente bloqueia conteúdo sem aprovação. Preparar uma questão sintética/manual adequada para demonstração ou efetuar uma decisão real e responsável no conteúdo a mostrar; não apresentar os 47 pendentes como validados. Não é necessário gerar nova amostra. |
| **Importante, mas não impeditiva com banco novo** | Checksum da migração inicial mudou. Conferir histórico caso a demonstração reutilize instalação antiga; o procedimento com banco novo foi aprovado. Nenhuma correção de histórico real foi feita. |
| **Importante, mas não impeditiva** | Atualizar o texto com seis erros/13 bloqueios/47 pendentes, zero pareceres humanos, distinção de mocks e custo estimado. Omitir esses fatos comprometeria a credibilidade acadêmica. |
| **Importante, mas não impeditiva para os fluxos já exercitados** | A cadeia completa de programação e a entrega externa de SMTP/Socket não foram validadas nesta etapa. Se fizerem parte da apresentação, conferir previamente apenas o percurso selecionado no ambiente da demonstração. |
| **Limitação aceitável para TCC de desenvolvimento de software** | Sem estudo de aprendizagem/usabilidade humana/carga/pentest e com cobertura parcial, MariaDB e 21 avisos de lint. Declarar o alcance sem prometer eficácia pedagógica, segurança absoluta ou validação integral. |

Não foi encontrado novo defeito de aplicação impeditivo nos cenários testados. As duas restrições classificadas como impeditivas são condicionais ao percurso escolhido para a apresentação; o preview e o smoke verificados passaram.

## Reprodução e encerramento

Comandos e etapas: [registro reproduzível](evidencias-tcc-final/COMANDOS.md). Novos artefatos são exclusivamente deste relatório e `evidencias-tcc-final/`, além dos dois arquivos de testes já identificados. Os hashes preservados e a conferência final permitem distinguir esta etapa da campanha anterior.

A instância MariaDB nova foi parada normalmente e o preview foi encerrado; o diretório sintético foi conservado. Serviços preexistentes não foram encerrados. Nenhuma chave configurada foi incluída intencionalmente nos arquivos; a conferência final verifica valores sensíveis sem imprimi-los. Os valores JWT nos comandos são exclusivamente os segredos sintéticos desta suíte. Não houve edição de `.env`, produção, documento acadêmico remoto, push ou deploy. As decisões de revisão dos testes são ações automatizadas de fixtures, não pareceres de docentes. A fase de verificação está concluída dentro desse alcance.
