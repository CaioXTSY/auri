# Relatório de validação técnica da AURI para o TCC

Data: **13 de outubro de 2026**, America/Sao_Paulo. Horários ISO nos JSON estão em UTC.

## 1. Resultado e alcance

As correções foram incorporadas ao código principal da branch local `main`, sem push, deploy ou alteração de produção. Foram executados **141 casos de teste, todos aprovados**: 84 unitários, 45 de API/banco, cinco de Docker e sete de navegador. Backend, worker e frontend compilaram. O lint terminou sem erros; o backend conserva 21 avisos.

Foram salvos **120 quizzes reais, de uma questão cada**: 60 preliminares e uma amostra posterior de 60, com 20 rótulos solicitados de cada dificuldade. A amostra posterior teve gabaritos A=17, B=12, C=17 e D=14. Todos os pares alternativa/explicação e o conteúdo apontado pelo gabarito foram preservados no embaralhamento, em 60/60 registros.

Isso **não comprova correção pedagógica**. A execução isolada e a inspeção assistida por IA encontraram seis inconsistências de gabarito/conteúdo que haviam passado pelo revisor de IA. Também foram encontrados sete registros com referências à posição das opções e uma repetição de enunciado. Como um registro pertence a dois grupos, **13 questões foram bloqueadas como `AUTO_REJECTED` e 47 permanecem `PENDING`**. Nenhuma questão dessa amostra recebeu aprovação humana ou foi publicada para alunos reais.

O custo estimado da amostra posterior, incluindo tentativas rejeitadas, foi **US$ 0,0937942**, ou **US$ 0,00156324 por questão salva**. O custo observado das duas etapas foi **US$ 0,1440208**. Esse último valor é um **limite inferior**, pois uma tentativa preliminar não retornou uso e uma interrupção inicial pode ter deixado chamadas sem registro durável. Não foi consultada uma fatura do provedor.

## 2. Identificação da versão e ambiente

| Item | Registro |
|---|---|
| Branch inicial e final do código | `main` |
| Commit inicial | `4fdd914a07fdca80c70dd43af47f48fb8eb4a38c` |
| Modificações locais preexistentes | Nenhuma, conforme `git status --short` inicial |
| Implementação principal | `ec7fc1b576e4e8d6a465981369566fd4e54c4346` |
| Ajuste do comparador de auditoria | `0d935551233208f1295e9398fef916a8e167dffb` |
| Código final validado | **`090eb79d018261abadd904f2beec44b29b0e6ecb`** |
| Evidências de identidade | [Versão avaliada](evidencias-tcc/versao-avaliada.json), [SHA-256 das fontes](evidencias-tcc/fontes-testadas-sha256.json), [arquivos alterados](evidencias-tcc/arquivos-alterados.txt) |
| Node no host | 26.4.0 |
| NestJS / Prisma / Jest | 11.1.28 / 5.22.0 / 29.7.0 |
| React / Vite / TypeScript / Playwright | 19.2.4 / 7.3.6 / 5.9.3 / 1.58.1 |
| Banco efetivamente testado | MariaDB 10.4.32, instância própria em `127.0.0.1:33307` |
| Banco da avaliação | `auri_tcc_20261013` |
| Banco novo para migrações | `auri_tcc_migration_20261013` |
| Executor | WSL `AURI-TCC-Judge`, Docker 29.9.0, Node 20.20.2 e Python 3.12.15 |

As imagens utilizadas e seus digests estão em [versões do executor](evidencias-tcc/versoes-executor.json). O banco foi inicializado em um diretório temporário específico da tarefa; não foi reutilizado banco de produção. Os dados de usuários, turmas e entregas dos testes são sintéticos. O envio de e-mail foi substituído por um mock nos testes de API.

**Proveniência experimental:** a geração ocorreu durante uma implementação iterativa. Os prompts e respostas de cada chamada foram preservados. As últimas regras para referências a “opção” e repetição foram adicionadas após a inspeção da amostra, e a amostra inteira foi reexaminada pelo código final. Portanto, os 60 registros não constituem uma campanha prospectiva congelada exclusivamente no commit `090eb79`. Os testes finais de regressão, a compilação e a conferência da persistência utilizaram o código corrigido. Um eventual commit posterior contendo apenas este relatório e as evidências não muda a versão dos serviços indicada acima.

## 3. Arquitetura observada

| Componente | Implementação efetiva |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind, React Router, Zustand, TanStack Query e Axios; diretório `frontend/` |
| API | NestJS, REST, JWT, validação de DTOs, controle de perfis, WebSockets e agendamento; `backend/src/` |
| Persistência | Prisma com provider MySQL; esquema e migrações em `backend/prisma/` |
| Executor de programação | Worker separado, polling de submissões e execução por Docker; `backend/src/worker/` |
| Gamificação | Facade `GamificationService`, pontos, níveis, conquistas e rankings; worker com processamento de recompensas de programação |
| Quizzes | Gerador, prompt, revisão assistida, missões e tentativas em `backend/src/modules/missions/` |
| Serviços externos | OpenAI por `fetch` HTTP; SMTP por Nodemailer; Socket.IO para notificações |

Não foi realizado deploy ou avaliação da topologia de produção. A existência da dependência `openai` não implica seu uso no gerador: o caminho examinado faz chamadas HTTP diretamente.

## 4. Estado inicial e problemas comprovados

O TCC disponibilizado pelo usuário foi consultado como fonte de contexto, sem edição: [documento “auri”](https://docs.google.com/document/d/1pL_bZ3TiLvAQ7ah9yzEiunsXSXU8VvYazu79fZKM8L8/edit?tab=t.0). A seção 5.4 relata dez quizzes históricos com gabarito A e dificuldade média. Os dez registros completos não foram localizados nos arquivos acessíveis deste repositório; essa descrição histórica não foi convertida em nova observação experimental.

| Problema | Evidência no código inicial ou reprodução |
|---|---|
| XP e rankings divergentes | `GamificationService.addPoints` atualizava pontos/progressão, sem atualizar rankings. Reexecução dos serviços do commit inicial: XP=480, rankings global/turma=475. |
| Posições influenciadas por funcionários | `RankingService.updateGlobalRanking` agregava todos os usuários; o filtro ALUNO era aplicado apenas na consulta final. Na comparação sintética, um aluno aparecia em posição 2, apesar de ser o único aluno com XP. |
| Limite e registros obsoletos | Ranking global limitado a 100 na materialização; rankings não removiam necessariamente entradas de usuários que deixaram a turma. Evidência por inspeção; comportamento corrigido testado com 103 alunos elegíveis e remoção de matrícula. |
| Contagem visual do professor | `getStudents` inclui o proprietário como participante. `ClassWorkspace` usava o tamanho dessa lista no fallback, e a tela de entregas também usava a lista para calcular pendências. Um professor + um aluno são dois participantes, mas um aluno. |
| Contagem após mudança de perfil | As contagens de matrícula não filtravam o perfil atual do usuário. A fixture com matrícula antiga de administrador comprovou a exclusão correta após a alteração. Matrículas normais já exigiam ALUNO e solicitações pendentes já estavam separadas. |
| Recompensas vulneráveis a repetição/concorrência | Leitura de estado antes da transação em quizzes, missões e correções; conquista e crédito em operações separadas; pontuação de programação calculada a partir de outras submissões, sem conferir o total já creditado. Essas fragilidades foram identificadas por inspeção; os testes posteriores comprovaram idempotência nos cenários examinados, sem afirmar reprodução de todos os interleavings antigos. |
| Concluir quiz pelo endpoint de missão | A conclusão genérica não exigia responder ao quiz. A versão corrigida recusa esse caminho. |
| Índice ausente convertido em gabarito | `normalizeGeneratedQuiz` usava `Number(parsed.correctIndex)`: `null` virava zero. O comparador executou o normalizador antigo e confirmou aceitação de índice nulo e opções duplicadas. |
| Âncora de posicionamento | O exemplo do prompt usava `correctIndex: 0`; não havia embaralhamento posterior. É uma causa plausível de viés, mas não prova a causa específica dos dez registros históricos. |
| Seleção de dificuldade incompleta | `getTargetDailyDifficulty` nunca selecionava FACIL. A resposta podia trazer uma dificuldade válida diferente da solicitada e ser aceita. Não havia dificuldade fixa MEDIO em toda a implementação; a uniformidade histórica não foi causalmente explicada. |
| Auditoria incompleta | Apenas a última geração aprovada era salva; tentativas rejeitadas e seus conteúdos não ficavam integralmente disponíveis. |
| Publicação sem decisão humana | Uma questão aceita pelas verificações automáticas era disponibilizada como missão diária, sem estado pendente e decisão de um responsável. |
| Migração inicial inválida no ambiente | A primeira aplicação falhou com erro SQL 1064 por BOM UTF-8 no início de `20260921000000_initial_schema/migration.sql`. Removido o BOM, as três migrações funcionaram em banco novo. |

A [comparação executável antes/depois](evidencias-tcc/comparacao-before-after.json) utiliza `git show` para carregar serviços do commit inicial, sem trocar ou modificar o checkout. Os callbacks de níveis/conquistas são simulados apenas nessa comparação. Os serviços completos foram testados separadamente na API.

## 5. Correções e comportamento final

| Arquivo ou conjunto | Solução, justificativa e comportamento |
|---|---|
| `gamification/reward-store.ts`, `points.service.ts`, esquema Prisma | Lock de usuário dentro da transação; concessão única por usuário/fonte/referência, chave de idempotência única e reconhecimento de registros antigos. Evita duplicar as recompensas identificadas, preservando créditos históricos. Concessões administrativas sem referência continuam podendo ser repetidas. |
| `gamification.service.ts`, `achievements.service.ts` | Atualização de rankings após progressão; conquista e crédito atômicos. Atualiza turmas do usuário, incluindo efeitos de bônus/conquistas. |
| `ranking.service.ts` | Consulta única compartilhada: ALUNO antes da classificação, soma do ledger, zero XP, desempate por ID, remoção de entradas obsoletas e persistência transacional. Mantém IDs de participantes por upsert. Reconstituir na leitura também permite recuperar uma atualização interrompida. |
| `programming-gamification.service.ts` | Usa o total já creditado ao usuário/atividade para conceder apenas a diferença positiva; reutiliza ranking e helpers de recompensa; limita crédito a submissões oficiais. Reprocessamento: 0 XP adicional; melhora 70→100: +30. |
| `activities.service.ts` | Lê novamente `xpAwarded` após lock e grava XP/estado juntos. Duas correções simultâneas concederam uma recompensa de 100 XP. |
| `classes.service.ts`, `admin.service.ts` | Contagens e listas de alunos consideram o perfil atual ALUNO. Professor proprietário permanece participante, e solicitações pendentes não são matrículas. |
| `ClassWorkspace.tsx`, `TeacherUnifiedActivitySubmissions.tsx` | Excluem proprietário/funcionários do fallback de alunos e do cálculo de pendências. |
| `quiz-quality.ts`, `quiz-generator.service.ts`, prompt | JSON Schema para geração; validação sem coerção de índice; dificuldade retornada deve corresponder à solicitada; opções únicas/não vazias e explicações completas; alertas de pistas/referências posicionais; Fisher–Yates com `crypto.randomInt`. Permuta opções e explicações juntas, atualizando o índice correto. |
| `quiz-generator.service.ts` | Dificuldade adaptativa admite FACIL/MEDIO/DIFICIL; na ausência de histórico suficiente, rotação por dia da aplicação. Rejeita enunciados iguais após normalização dentro dos 200 registros de IA consultados nos últimos 14 dias; o prompt usa até 14 resumos. Essa verificação não é garantia global contra repetições semânticas ou todas as corridas de múltiplos processos. |
| `quiz-generator.service.ts`, `AIGeneration` | Salva auditoria de todas as tentativas, modelo retornado por chamada, uso/cache e resultado; limita a três tentativas e evita insistir em erros de credencial/quota. Chave diária única evita duas missões automáticas do mesmo dia em instâncias distintas. |
| `quiz-review.service.ts`, DTO, controller/module, `MissionQuiz` | Estado PENDING, fila por responsabilidade, aprovação/rejeição com justificativa, ator e data, e transição condicional contra decisões concorrentes. Aluno não acessa fila/gabarito administrativo nem responde a quiz pendente. |
| `mission-quiz.service.ts`, `missions.service.ts` | Bloqueiam conteúdos não aprovados em leitura, início, resposta, listas e seleção aleatória. Corrigem acesso a questões futuras e limite superior do dia. Conclusão de quiz passa exclusivamente pela resposta correta. Quizzes manuais usam o validador compartilhado e registram autoria/publicação. |
| `QuizReviewQueue.tsx`, `AdminAIGenerations.tsx`, `DailyQuizModal.tsx` | Fila administrativa mostra enunciado, opções, gabarito e explicações; exige justificativa. Aluno recebe mensagem explícita de indisponibilidade/revisão. |
| `.env.example` | Documenta modo humano como padrão, alternativa automática explícita, modelo separado de revisão e desativação de geração para testes. Credenciais existentes não foram alteradas. |
| Migrações e schema | Nova migração acrescenta chaves de idempotência/dia, estados/decisões e auditoria. Dados preexistentes continuam disponíveis com aprovação legada; isso não representa parecer humano. A remoção de BOM modifica o checksum da migração antiga e requer atenção ao reconciliar históricos de instalações existentes. Nenhuma reconciliação de produção foi executada. |
| `test/`, `quiz-*.spec.ts`, `frontend/tests/e2e/quiz-review.spec.ts` | Regressões para qualidade, dificuldades, contagem, XP, concorrência, permissões e fluxo de revisão; banco explicitamente isolado; SMTP simulado. |
| `test/docker-wsl-bridge.cjs`, teste do runner | Adaptação somente para testes, mantendo o executor real. O teste de rede passou a exigir falha de roteamento para IP literal, evitando confundir timeout de DNS com liberação de rede. |
| `frontend/vite.config.ts`, `playwright.config.ts` | Configuração de caminho compatível com ESM/carregador nativo e opção de Chromium verificado para este ambiente. |
| Scripts em `backend/scripts/` | Experimento pela implementação real, comparação de fonte antiga, execução isolada, consolidação verificável e bloqueio dos achados técnicos da amostra. O script de quarentena contém IDs deste experimento e não é um validador pedagógico genérico. |

A relação exaustiva dos arquivos de código alterados está em [arquivos alterados](evidencias-tcc/arquivos-alterados.txt). As expectativas de cada teste estão nas respectivas fontes; resultados individuais constam em [testes finais](evidencias-tcc/testes-final.json).

### Regras de negócio efetivas

- XP individual é a soma de `user_points`. O ranking da turma usa **o XP global dos alunos matriculados**, não apenas XP obtido nessa turma. Essa regra foi preservada.
- Nível = `floor(sqrt(XP / 100))`; os primeiros limiares são 0, 100, 400 e 900 XP. A avaliação não comprova todos os casos de concorrência de gatilhos de níveis.
- Conquistas concedem os valores configurados no banco. O seed inspecionado associa 10 a FIRST_LOGIN, 20 a FIRST_CLASS_JOIN, 50 a POINTS_100 e 30 a FIRST_MISSION_COMPLETED. Não foram atribuídos esses valores ficticiamente ao saldo-base da nova fixture.
- Missão/quiz correto concede `mission.points` uma vez. A tabela padrão de quizzes é FACIL=40, MEDIO=85 e DIFICIL=140. Resposta errada concede zero **pela missão**; conquistas configuradas podem ter critérios distintos. O código de FIRST_QUIZ_COMPLETED considera tentativas, não necessariamente acertos; esse critério não aparece no seed examinado e não foi redefinido nesta tarefa.
- Atividade acadêmica com nota positiva concede `xpReward` uma vez por entrega, conforme contrato existente. Programação concede a melhora positiva sobre o total já creditado à atividade.
- Bônus de sequência: 7/14/30/100 dias concedem 50/100/250/500 XP. O teste simultâneo examinou o marco de sete dias.

### Publicação e revisão

`QUIZ_REVIEW_MODE=human` é o padrão para novas gerações. O agendador permanece, mas a disponibilização espera aprovação. Uma pendência já existente não causa nova geração a cada consulta. `QUIZ_REVIEW_MODE=automatic` preserva explicitamente a operação sem parecer humano e registra essa condição. O teste desse modo usou geração simulada, sem custo OpenAI.

Professores podem revisar por API apenas missões sob sua responsabilidade; a interface adicionada atende ao administrador, responsável pelas questões globais. A fila lista até 100 pendências. Conteúdos rejeitados precisam ser substituídos/corrigidos por um responsável; não foi implementada regeneração automática após rejeição humana.

## 6. Testes e resultados numéricos

| Grupo | Executados | Aprovados | Reprovados finais | Não executados |
|---|---:|---:|---:|---:|
| Unitários Jest | 84 | 84 | 0 | 0 |
| API e banco isolado | 45 | 45 | 0 | 0 |
| Docker real | 5 | 5 | 0 | 0 |
| Navegador Playwright | 7 | 7 | 0 | 0 |
| **Total de casos** | **141** | **141** | **0** | **0** |

Esses números contam casos declarados pelas ferramentas, não chamadas HTTP, assertions ou chamadas OpenAI. Os sete testes de navegador usam APIs sintéticas; a autorização e persistência reais são verificadas na suíte de API. O SMTP é simulado. A geração de IA nos testes determinísticos é simulada ou desabilitada; a seção experimental seguinte contém chamadas pagas reais.

| Cenário | Esperado | Obtido |
|---|---|---|
| Contagem | 1 aluno; 2 participantes, incluindo 1 proprietário; pendência e matrícula histórica de funcionário não contam | 1 / 2 / 1 |
| Base sintética de XP | XP individual/global/turma = 475 | 475 / 475 / 475 |
| Missão de +5 | Os três indicadores = 480 | 480 / 480 / 480 |
| Resposta errada | Recompensa da missão = 0; saldo da fixture = 480 | 0 / 480 |
| Quiz correto de +5 | Os três indicadores = 485 | 485 / 485 / 485 |
| Duas conclusões simultâneas | Uma aceita, outra recusada; sem crédito duplo | HTTP 201 e 400 |
| Duas respostas corretas simultâneas | Uma aceita, outra recusada; sem crédito duplo | HTTP 201 e 400 |
| Conquista de 30 simultânea | 1 desbloqueio, 1 crédito, XP=515 | 1 / 1 / 515 |
| Rollback de recompensa de 99 | XP permanece 515 | 515 |
| Bônus simultâneo de sete dias | Streak=7, 1 crédito de 50, XP=565 | 7 / 1 / 565 |
| Duas correções acadêmicas | 100 XP totais, 1 crédito, xpAwarded=100 | 100 / 1 / 100 |
| Programação: dois processamentos de nota 70 | Créditos 70 e 0 | 70 e 0 |
| Programação: melhora para 100 / novo processamento | +30 / +0 | +30 / +0 |
| XP da segunda fixture após atividade/programação | 200 | 200 |
| Ranking global com zero XP e >100 alunos | 103 elegíveis, posições contíguas, funcionários excluídos | 103; todos os predicados verificados |
| Desmatrícula | Usuário removido do ranking da turma | Somente aluno ainda matriculado permaneceu |
| Dois geradores independentes no mesmo dia | Uma missão diária, PENDING | 1 / PENDING; geração simulada |
| Modo automático explícito | Publicado, APPROVED, revisor humano ausente | Conforme esperado; geração simulada |
| Proteção de conteúdo pendente | Sem leitura/início/resposta pelo aluno | HTTP 404 |
| Fila e gabarito administrativo para aluno / professor alheio | Acesso negado | HTTP 403 |
| Aprovação sintética | Estado, responsável e data persistidos; publicação liberada | Verificado em API e banco |
| Segundo parecer/rejeição | Decisão já tomada recusada; rejeitado não acessível | HTTP 400 / 404 |
| Quiz futuro / índice fracionário / conclusão sem resposta | Recusados | HTTP 400 |
| Permutações | 24 ordens distintas; cada opção permanece com sua explicação e chave correta | 24; nenhuma falha |
| Persistência da amostra | 60 leituras idênticas ao conteúdo salvo; 92 auditorias de chamadas iguais | 60 / 92; nenhuma divergência |

[Resultados esperados e obtidos das sondagens de integração](evidencias-tcc/integracao-resultados.json) incluem os valores efetivamente coletados. Os testes Jest preexistentes não instrumentam todos os valores intermediários em seus logs; sua aprovação indica satisfação das assertions existentes, sem inventar valores que a ferramenta não registrou.

### Verificações adicionais e impedimentos resolvidos

- Os 57 testes iniciais passaram antes das alterações: [baseline](evidencias-tcc/baseline-tests.json).
- As três migrações foram aplicadas em um segundo banco vazio: [migração nova](evidencias-tcc/tcc-migration-fresh.txt). Esquema validado e nenhuma migração pendente no banco de avaliação.
- [Build backend](evidencias-tcc/tcc-build-backend.txt), [worker](evidencias-tcc/tcc-build-runner.txt) e [frontend](evidencias-tcc/tcc-build-frontend-native.txt) passaram; o build do frontend inclui tipagem executada separadamente.
- [Lint backend](evidencias-tcc/tcc-lint-backend.txt): zero erros e 21 avisos. [Lint frontend](evidencias-tcc/tcc-lint-frontend.txt): sem erros.
- O comando padrão de build/dev do Vite falhou por acesso a diretórios pelo esbuild neste ambiente. O carregador nativo compilou; a configuração ESM foi corrigida. A suíte de navegador utilizou o preview compilado e um Chromium local verificado, pois o headless shell esperado estava ausente e a instalação automática não concluiu. Isso não prova funcionamento do carregador padrão neste host.
- O teste antigo de bloqueio de rede falhou porque seu timeout de DNS terminava antes da resposta de erro. O novo teste usa IP literal e exige erro de roteamento; os cinco testes Docker passaram. Não houve redução dos requisitos de isolamento.
- Falhas intermediárias de mocks/compilação durante a implementação foram corrigidas. Não há teste reprovado na execução final; nenhuma suite foi apagada para obter esse resultado.

## 7. Experimento com IA real

### Procedimento e auditoria

O script `evaluate-tcc-quizzes.ts` chamou `QuizGeneratorService.generateEvaluationQuiz`, que reutiliza o fluxo principal de prompt, geração, validação, revisão assistida, embaralhamento e persistência. O banco e o modo de avaliação são verificados antes da operação. Nenhuma publicação para usuários reais ocorreu.

Foram usados os dez assuntos introdutórios solicitados, alternando Python e JavaScript e variando os formatos propostos. O conteúdo efetivamente retornado pode divergir da proposta; não foi presumida variedade pedagógica pelo simples preenchimento do tópico. Cada geração teve no máximo três tentativas; cada lote no máximo três solicitações simultâneas, com teto finito de solicitações por dificuldade. A retomada para obter os quatro quizzes difíceis restantes foi registrada.

| Etapa | Solicitações de quiz | Questões salvas | Chamadas/tentativas registradas | Conteúdos de geração recebidos |
|---|---:|---:|---:|---:|
| Preliminar | 72 | 60 | 214 | 111; uma tentativa sem resposta/uso |
| Posterior | 92 | 60 | 257 | 183 |
| Total observado | 164 | 120 | 471 | 294 |

Na amostra posterior, 123 dos 183 candidatos foram rejeitados antes da persistência: seis por estrutura e 117 por regras de qualidade/revisão. Destes, 103 foram barrados por referências posicionais detectadas naquela versão e 14 por rejeição/discrepância do revisor. Após acrescentar o sinônimo “opção”, a reclassificação retrospectiva encontrou 110 candidatos com referência posicional; esse número não deve ser confundido com as rejeições originalmente ocorridas.

Os dados brutos são [amostra posterior](evidencias-tcc/quizzes-reais.json), [preliminar](evidencias-tcc/quizzes-preliminares.json) e [métricas consolidadas](evidencias-tcc/metricas-consolidadas.json). O arquivo de chamadas por evento complementa os registros da etapa posterior. Respostas simuladas dos testes não entram nestes totais.

### Distribuição dos gabaritos

| Alternativa | Mesmos 60 antes de embaralhar | Após embaralhar | Percentual final |
|---|---:|---:|---:|
| A | 30 | 17 | 28,33% |
| B | 21 | 12 | 20,00% |
| C | 7 | 17 | 28,33% |
| D | 2 | 14 | 23,33% |

Não foram impostas cotas de 25%. Foram conferidos todos os pares de alternativas/explicações e o conteúdo da resposta apontada, em 60/60 casos: [integridade](evidencias-tcc/integridade-embaralhamento.json). Isso prova preservação do mapeamento da resposta proposta, **não que essa resposta seja semanticamente correta**.

### Dificuldades

| Solicitada | Solicitações, incluindo falhas | Retornada e persistida nos salvos | Estimativa exploratória do revisor |
|---|---:|---:|---|
| FACIL | 28 | 20 FACIL | 20 FACIL |
| MEDIO | 29 | 20 MEDIO | 10 FACIL; 10 MEDIO |
| DIFICIL | 35 | 20 DIFICIL | 16 FACIL; 4 MEDIO |

Houve zero divergência entre dificuldade solicitada, retornada e persistida nos 60 registros salvos. Entretanto, o revisor atribuiu dificuldade diferente em **30/60 casos** e não classificou nenhum como DIFICIL. Isso é um indício de inadequação dos rótulos, não uma classificação pedagógica independente. O revisor recebia o nível solicitado e as explicações, embora o gabarito proposto estivesse omitido; pode haver ancoragem. Não é correto afirmar que foram comprovadas 20 questões pedagogicamente difíceis.

### Estrutura, execução e achados posteriores

Os 60 quizzes salvos possuem estrutura completa, sem opções vazias/duplicadas, índices inválidos ou divergência de serialização constatada. Houve uma repetição de enunciado após normalização de espaços. A inexistência de repetição semântica não foi comprovada.

Foram executados os **60 blocos de código da amostra posterior**, usando o `runDocker` real, e também 60 da etapa preliminar. Os contêineres não tinham rede nem mounts do host, usavam usuário sem privilégios, filesystem somente leitura e limites de memória/CPU/PIDs/tempo. As saídas e erros estão em [execução posterior](evidencias-tcc/quizzes-reais-execucao.json) e [preliminar](evidencias-tcc/quizzes-preliminares-execucao.json).

O comparador mecânico de saída reconheceu 26 correspondências de gabarito e deixou 34 casos inconclusivos. Esses 34 incluem respostas descritivas, mensagens em stderr, retornos não impressos e questões conceituais de complexidade. Não foram classificados indiscriminadamente como erros. A inspeção dos registros inconclusivos, assistida por Codex, documentou seis inconsistências:

| Questão, identificada pelo prefixo do ID | Comportamento executado | Gabarito/problema |
|---|---|---|
| `7f3d1668` | Python imprime `1010101010` | Alegava TypeError ao multiplicar inteiro e string; nenhuma opção corresponde à saída. |
| `58c09147` | Python imprime `50 5555555555` | Alegava TypeError; explicações incorretas e ausência da saída nas opções. |
| `e8aa8278` | Python imprime `40.0` | Gabarito `20.0`; explicação usa um divisor ausente no código. |
| `5967b803` | Python imprime `OACAMARGORP` | Gabarito `OACIMARGORP`; explicação também referencia posições. |
| `7898d568` | JavaScript imprime `10`, sem erro | Enunciado pressupõe um erro e escolhe overflow condicionado a outro tamanho de entrada. |
| `f630bc71` | Python imprime `10.0` | Gabarito `15.0`; existe opção com `10.0`, e a explicação calcula 30/3 incorretamente. |

A concordância anterior entre geração e revisão de IA, portanto, **falhou nesses seis casos**. Sete registros adicionais/com sobreposição tinham referências posicionais nas explicações; uma questão repetida também foi bloqueada. O estado final é 13 rejeições técnicas automáticas, 47 pendências, zero aprovações humanas e zero pareceres pedagógicos humanos: [decisões técnicas](evidencias-tcc/revisao-tecnica-pos-geracao.json). A quarentena preservou os conteúdos originais para auditoria.

## 8. Tokens e custos

Tarifas verificadas em documentação oficial: [GPT-4o mini](https://developers.openai.com/api/docs/models/gpt-4o-mini) e [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini). Valores por milhão de tokens: 4o-mini entrada 0,15/cache 0,075/saída 0,60; 4.1-mini entrada 0,40/cache 0,10/saída 1,60 USD.

| Etapa/modelo retornado | Operação | Chamadas | Entrada | Saída | Entrada em cache | Estimativa USD |
|---|---|---:|---:|---:|---:|---:|
| Preliminar / `gpt-4o-mini-2024-07-18` | Geração | 111 | 137.739 | 31.461 | 40.192 | 0,03652305 |
| Preliminar / mesmo modelo | Revisão | 102 | 57.429 | 8.482 | 0 | 0,01370355 |
| Preliminar / solicitado `gpt-4o-mini` | Tentativa sem resposta | 1 | N/D | N/D | N/D | Não estimável |
| Posterior / `gpt-4o-mini-2024-07-18` | Geração | 183 | 250.884 | 52.246 | 110.464 | 0,06069540 |
| Posterior / `gpt-4.1-mini-2025-04-14` | Revisão | 74 | 46.055 | 9.173 | 0 | 0,03309880 |
| **Total com uso conhecido** | | **470** | **492.107** | **101.362** | **150.656** | **0,14402080** |

Fórmula: `((entrada - cache) × tarifa_entrada + cache × tarifa_cache + saída × tarifa_saída) / 1.000.000`. Tentativas rejeitadas com uso disponível estão incluídas; rejeições de conteúdo não são falhas HTTP. A etapa posterior tem uso disponível em todas as 257 chamadas. A etapa preliminar inclui 52 candidatos não salvos, sendo uma tentativa sem resposta; a etapa posterior inclui 123 candidatos rejeitados e 32 solicitações que esgotaram tentativas.

A auditoria por chamada é necessária porque os tokens agregados de uma `AIGeneration` podem incluir modelos diferentes. O campo `model` do registro principal identifica o modelo de geração e não deve ser usado sozinho para tarifar a revisão.

**Limitação contábil:** a tentativa sem resposta e chamadas eventualmente completadas durante a interrupção inicial não permitem reconstruir uma fatura integral. O total observado é um limite inferior estimado pelas tarifas, não um valor cobrado confirmado. Os custos do próprio chat Codex, Docker local e infraestrutura não foram mensurados. Não foi inventado consumo ausente.

## 9. Comparação com resultados anteriores

| Conjunto | Evidência disponível | Interpretação permitida |
|---|---|---|
| Dez históricos do TCC | Descrição no documento: dez A, dez MEDIO, ambiguidades/comentários/explicação incorreta e ausência de pareceres humanos | Observação histórica atribuída ao TCC; arquivos completos e correspondência com a antiga campanha de custos não recuperados. |
| Código inicial | Reprodução sintética dos serviços de ranking/normalização, com fonte identificada por commit | Prova local da divergência XP/ranking e da aceitação estrutural inadequada nos cenários reproduzidos. |
| Etapa preliminar | 60 questões salvas, gabaritos 16/11/17/16; geração/revisão com mesmo modelo | Evidência intermediária, não baseline antigo. |
| Etapa posterior e auditoria final | 60 questões, gabaritos 17/12/17/14, 13 bloqueadas tecnicamente | Melhor controle de posicionamento e publicação; persistem falhas de conteúdo e rótulo pedagógico. |

A comparação de posição antes/depois do embaralhamento usa os mesmos 60 registros e isola esse mecanismo. A comparação de qualidade entre históricos, preliminar e posterior não é causal: amostras, prompts, critérios, modelos e momentos diferem. O equilíbrio do gabarito não é evidência de melhoria da aprendizagem nem de validação pedagógica.

## 10. Conteúdo factual para atualização do TCC

| Seção | Informação que pode ser incorporada |
|---|---|
| **4.5.5 — Gamificação** | O ledger é a fonte do XP; recompensas identificadas usam lock/transação e idempotência; rankings consideram alunos e somam o mesmo XP individual, inclusive nas turmas em que estão matriculados. Especificar desempate e diferença entre alunos e participantes. |
| **4.5.7 — IA** | Descrever JSON Schema, validação estrutural, dificuldade solicitada, revisão assistida sem receber o gabarito proposto, embaralhamento conjunto e auditoria por chamada. Novas gerações ficam pendentes por padrão; aprovação/rejeição exige responsável e justificativa. Modo automático é explícito. |
| **5.2.3 — Pontuação** | Relatar a sequência nova 475→480→485, identificando 475 como base sintética inserida para o teste. Informar os três indicadores, a concorrência com uma aceitação/uma recusa e os casos de conquista, atividade, programação e rollback. Não afirmar que todas as recompensas históricas até 475 foram reexecutadas. |
| **5.4 — Avaliação de IA** | Apresentar amostra posterior de 60 questões rotuladas 20/20/20, distribuição 17/12/17/14, integridade 60/60, execuções, seis inconsistências de conteúdo, 13 bloqueios e 47 pendências. Informar zero pareceres humanos e 30 divergências exploratórias de dificuldade. |
| **5.5 — Discussão** | Distinguir consistência de dados, validade de conteúdo e dificuldade pedagógica. O gerador e o revisor concordaram incorretamente em seis casos; o controle de publicação evitou disponibilização automática no experimento. |
| **6.2 — Limitações** | Registrar tamanho/amostragem, alterações iterativas, ausência dos arquivos históricos, falta de fatura integral, uso de MariaDB em vez de MySQL 8, inconclusivos da execução e ausência de professores/estudantes na validação. |
| **6.3 — Trabalhos futuros** | Propor avaliação por docentes, rubricas de dificuldade, execução automática no serviço de avaliação isolado, novos geradores/revisores, detecção de repetições semânticas, estudos com estudantes, testes de carga/concorrência ampliados e redução dos avisos de tipagem. São propostas, não funcionalidades ou efeitos já comprovados. |

## 11. Limitações e lacunas remanescentes

Não foram comprovados desempenho sob carga, escalabilidade da reconstrução transacional de rankings, todos os cenários de concorrência/falha distribuída, MySQL 8, isolamento contra toda classe de código malicioso, qualidade pedagógica dos 47 pendentes, usabilidade por usuários reais ou efeitos sobre aprendizagem/motivação. A cobertura de testes não é exaustiva. A execução de um código em uma entrada não comprova sua complexidade assintótica ou unicidade de todas as alternativas.

O mecanismo de nível e gatilhos derivados não foi submetido a uma análise exaustiva de concorrência. A idempotência não corrige retroativamente quaisquer créditos antigos duplicados. As regras de pista de resposta são heurísticas e podem ter falsos positivos/negativos. A revisão por IA permanece exploratória; nem concordância entre modelos nem um rótulo persistido constituem parecer pedagógico.

## 12. Reprodução, proteção de dados e encerramento

O procedimento e os comandos reproduzíveis estão em [guia da avaliação](backend/scripts/TCC_VALIDATION.md). A lista de fontes, hashes, testes, métricas, registros e saídas acompanha o relatório em `evidencias-tcc/`.

Nenhuma chave OpenAI, senha SMTP ou segredo JWT foi incluído deliberadamente nas evidências. A conferência final procura os valores efetivamente configurados sem imprimi-los. Não foram enviados dados pessoais ou de produção à OpenAI. As chamadas usaram apenas temas e registros sintéticos do banco isolado. Nenhuma credencial existente foi modificada e nenhum push/deploy foi realizado.

As aprovações/rejeições feitas nas suites são **ações automatizadas de fixtures sintéticas**, não pareceres humanos sobre os quizzes gerados. Os 13 bloqueios do experimento são identificados como decisões técnicas automatizadas/assistidas por IA. O documento do Google foi usado somente como contexto e permaneceu sem alterações.
