# AURI — Publicação automática dos quizzes diários

Data: **13/10/2026**, America/Sao_Paulo; timestamps JSON em UTC. A publicação automática foi restaurada com **160/160 testes aprovados** na execução final. Não houve chamada real nova à OpenAI, alteração do Google Docs, push ou deploy. Relatórios e evidências anteriores foram preservados.

## 1. Versão e alcance

| Item | Registro |
|---|---|
| Branch | `main` |
| HEAD inicial, Git limpo | `dd3514c79f681d7835be271ed09d6fbe4e9c79f9` |
| **Commit da implementação avaliada** | **`938db7b76d8920bbd74f7cfc38b93d9366871819`** |
| Alterações preexistentes | Nenhuma |
| Banco dos testes | MariaDB 10.4.32, `127.0.0.1:33309/auri_tcc_quiz_automatico_20261013` |
| Isolamento | Instância/diretório novos em `C:/Users/extas/AppData/Local/Temp/auri-quiz-automatico-20261013/db`; dados sintéticos |
| Dependências | Node 26.4.0, Nest 11.1.28, Prisma 5.22.0, Jest 29.7.0, TypeScript 5.9.3, React 19.2.4, Vite 7.3.6, Playwright 1.58.1 |

Os testes foram executados sobre os mesmos arquivos posteriormente commitados em `938db7b`. Um commit adicional contém somente este relatório e `evidencias-quiz-automatico/`; não altera a implementação. Seu identificador pode ser consultado por `git log -1 --format='%H %s' -- RELATORIO_QUIZ_AUTOMATICO_TCC.md`. O Git foi conferido limpo após o commit documental.

## 2. Funcionamento anterior e investigação

Foram consultados `RELATORIO_VALIDACAO_TCC.md`, `RELATORIO_FINAL_PARA_TCC.md`, gerador, agendador, API e interface. O modo explícito `QUIZ_REVIEW_MODE=automatic` **já funcionava**: antes das alterações, um teste em banco isolado confirmou publicação `APPROVED` sem revisor humano. Essa execução direcionada teve um caso aprovado e dez não selecionados: [JSON anterior](evidencias-quiz-automatico/automatic-before.json), [valores coletados](evidencias-quiz-automatico/integracao-before.json).

O problema era o padrão: configuração ausente ou `human` salvava novas questões como `PENDING`. Uma missão diária pendente/rejeitada também satisfazia a consulta “já existe quiz hoje”; se tivesse `dailyKey`, ocupava a chave única e impedia outra questão para aquela data. A interface administrativa mostrava uma fila de aprovação, e o aluno recebia mensagem de espera por responsável.

## 3. Mudanças e fluxo atual

O cron existente e a consulta do aluno continuam chamando `generateDailyQuizMission`. O backend define dificuldade/assunto, chama geração, valida JSON/estrutura/dificuldade, verifica alertas e repetição recente, chama o revisor de IA e embaralha alternativas/explicações em conjunto. **Somente um resultado aceito por esse pipeline é persistido como quiz diário `APPROVED`**, com registro de publicação automatizada e sem revisor humano.

Não é necessário configurar `QUIZ_REVIEW_MODE`; valores legados, inclusive `human`, **não mudam mais o fluxo diário**. Os parâmetros existentes de credencial, modelo, fuso e habilitação de geração continuam aplicáveis. Sem credencial ou com geração desabilitada, o sistema não faz chamadas de geração.

Se todas as tentativas falharem, nenhuma missão/questão nova é publicada e nenhuma pendência humana é criada. As tentativas e uso retornado permanecem na auditoria. A API e o modal informam: “Não foi possível disponibilizar um quiz diário válido. Tente novamente mais tarde.” O limite existente de três tentativas e a interrupção em erros de credencial/quota foram mantidos.

Um quiz diário já publicado continua sendo reutilizado, inclusive registros antigos sem `dailyKey`. A chave única da data e a transação continuam protegendo a publicação entre instâncias; solicitações à mesma instância compartilham a promessa de geração. Instâncias diferentes ainda podem consumir gerações simultâneas antes de a chave impedir publicação duplicada; não se afirma exclusividade global das chamadas pagas.

Para conteúdo antigo não aprovado, **não ocorre mudança automática de estado ou gabarito**. Se ocupar a chave do dia, essa chave é liberada na mesma transação que cria uma nova questão validada. ID, datas, conteúdo, estado e auditoria da questão antiga permanecem; ela continua inacessível ao aluno. A liberação não ocorre se a nova geração falhar. Nenhuma migração, alteração de schema, exclusão de dados históricos ou atualização em massa foi necessária. Os bancos e as amostras históricas da auditoria não foram reabertos/alterados.

A fila de aprovação foi retirada da tela administrativa e seu componente removido. O painel de gerações conserva histórico, prompts/respostas e métricas de consumo. Os endpoints autorizados de revisão de registros antigos foram mantidos por compatibilidade; não são chamados nem exigidos pelo cron, gerador ou aluno. Seus testes de permissões e de proteção dos pendentes foram mantidos.

A criação manual de atividades/quizzes foi preservada. O modo de **experimento isolado** também continua salvando `PENDING`: ele gera missões `PERSONALIZADA`, não publica quizzes diários, e mantém os guardas de banco/flag. Não confundir esse modo com o funcionamento diário da aplicação.

## 4. Arquivos da implementação

| Arquivo | Alteração |
|---|---|
| `backend/src/modules/missions/quiz-generator.service.ts` | Publicação diária sempre automática; consulta apenas publicação aprovada; libera chave ocupada por conteúdo não aprovado dentro da transação |
| `backend/src/modules/missions/mission-quiz.service.ts` | Remove ramificação humana na obtenção diária; mensagem de indisponibilidade em ambas as consultas diárias |
| `backend/.env.example` | Remove instrução de modo humano padrão; explica que configuração antiga não interfere na publicação diária |
| `backend/scripts/TCC_VALIDATION.md` | Atualiza descrição do fluxo atual, mantendo procedimento e particularidade do experimento isolado |
| `backend/src/modules/missions/quiz-generator.service.spec.ts` | Sete regressões adicionais: padrão e configurações antigas, retry, esgotamento, agendador e concorrência local |
| `backend/test/tcc-validation.e2e-spec.ts` | Atualiza o caso diário para exigir `APPROVED`; mantém qualidade, permissões, XP e demais cenários |
| `backend/test/quiz-automatic.e2e-spec.ts` | Nove casos com pipeline/API/banco reais e OpenAI simulada |
| `frontend/src/components/quiz/DailyQuizModal.tsx` | Substitui mensagem de revisão humana por indisponibilidade de geração |
| `frontend/src/pages/admin/AdminAIGenerations.tsx` | Remove exibição da fila; mantém painel de auditoria |
| `frontend/src/components/quiz/QuizReviewQueue.tsx` | Removido, pois essa tela não integra o fluxo diário solicitado |
| `frontend/tests/e2e/quiz-review.spec.ts` | Substituído pelo arquivo abaixo; a UI de aprovação foi retirada, não uma proteção de qualidade |
| `frontend/tests/e2e/quiz-automatic.spec.ts` | Testa auditoria sem fila, resposta do aluno/feedback e indisponibilidade sem espera humana |

Nenhum arquivo de gamificação, worker, criação manual ou migração foi modificado. Evidência de arquivos e hashes: [versão](evidencias-quiz-automatico/versao-avaliada.json).

## 5. Validações preservadas

- JSON Schema da geração e parsing estrito; campos obrigatórios e limites de título/enunciado.
- Quatro opções não vazias e distintas; quatro explicações; índice inteiro de 0 a 3 sem coerção.
- Dificuldade retornada igual à solicitada; seleção FACIL/MEDIO/DIFICIL já existente.
- Alertas de vazamento/explicação posicional/contradição e rejeição de enunciado normalizado repetido no histórico consultado.
- Revisão automatizada por IA com rejeição ou discordância de gabarito levando a nova tentativa.
- Fisher–Yates e preservação dos pares opção–explicação e da resposta proposta, com regressão das 24 permutações.
- Limite de três tentativas, auditoria de todas as chamadas e métricas retornadas para estimativa de custo. Uso ausente continua indisponível, sem inventar tokens/custo.
- Transação e chave diária única; ocultação de chave/explicações antes da resposta; autorização e bloqueio de conteúdo não aprovado/futuro.
- Crédito de XP transacional/idempotente; resposta repetida não duplica recompensa.

Revisão automatizada é uma verificação auxiliar. **Não garante correção pedagógica, semântica ou adequação de dificuldade.** A publicação automática é a regra de produto solicitada, não uma alegação de validação humana.

## 6. Testes e verificações executados

| Grupo | Executados na rodada final | Aprovados | Reprovados finais | Não executados finais |
|---|---:|---:|---:|---:|
| Unitários | 91 | 91 | 0 | 0 |
| API/banco isolado | 55 | 55 | 0 | 0 |
| Docker real | 5 | 5 | 0 | 0 |
| Navegador | 9 | 9 | 0 | 0 |
| **Total** | **160** | **160** | **0** | **0** |

Comparado à verificação anterior de 142 casos: +7 unitários, +9 API e +2 navegador. O caso antigo da UI de revisão foi substituído por um caso de auditoria sem fila, e dois casos do aluno foram adicionados. Reexecuções direcionadas/anteriores não são somadas ao total final. Contagens e resultados por caso: [consolidação](evidencias-quiz-automatico/testes-final.json).

| Cenário obrigatório | Resultado observado/evidência |
|---|---|
| Válido publicado automaticamente, sem configuração adicional | Unitário com variável ausente; API confirma `APPROVED` mesmo com variável antiga `human` |
| Aluno acessa sem aprovação | GET diário 200 após geração pelo pipeline real do backend; reviewedById nulo |
| Gabarito oculto | Resposta antes da tentativa não contém correctIndex/explanations; após resposta, disponíveis |
| Embaralhamento | Pares e resposta correta preservados no registro real do banco; testes das 24 permutações continuam passando |
| XP único | Duas respostas corretas simultâneas retornam 201/400; um crédito de **40 XP** e uma entrada no ledger |
| Inválido rejeitado, depois retry | JSON inválido seguido de válido: duas gerações, uma revisão, três chamadas auditadas; apenas candidato validado publicado |
| Revisor de IA rejeita, depois retry | Duas gerações e duas revisões; segunda questão publicada automaticamente |
| Todas as tentativas inválidas | HTTP 404; três chamadas auditadas, status REJECTED, zero quizzes e nenhuma pendência criada |
| Concorrência entre instâncias | Uma publicação por dailyKey; testado sem histórico e substituindo PENDING, AUTO_REJECTED e REJECTED |
| Agendador | Método do agendador existente percorre o pipeline e o aluno recebe 200; teste não espera a passagem real de meia-noite |
| Registros antigos | Publicado sem dailyKey é servido sem geração; não aprovados preservam estado/conteúdo e continuam com 404 |
| Sem fila humana | Frontend não solicita endpoints da fila, não mostra aprovação; auditoria e métricas continuam visíveis |

Valores coletados: [novo fluxo](evidencias-quiz-automatico/quiz-automatic-resultados.json), [gamificação existente](evidencias-quiz-automatico/integracao-resultados.json), [smoke integrado existente](evidencias-quiz-automatico/smoke-resultados.json). Gamificação repetiu 475→480→485 nos indicadores individual/global/turma; conquistas, correção acadêmica, recompensa de programação, streak, rollback e concorrência continuaram aprovados.

Os nove testes novos de API usam serviços/persistência/validação/embaralhamento reais, mas substituem `fetch` da OpenAI por respostas sintéticas. JWT usa usuário sintético; SMTP é mockado. Os testes de navegador usam APIs sintéticas. Docker executa contêineres reais. Os 45 tokens registrados no teste de falha são **dados de mock**, não consumo cobrado.

Falhas/ocorrências intermediárias foram preservadas: a primeira compilação do teste novo declarou dificuldade como string em vez do enum Prisma; corrigiu-se a tipagem da fixture e o teste passou. Em duas execuções Docker, a checagem de disponibilidade (com timeout existente de cinco segundos) classificou o executor como indisponível e pulou os cinco casos. `docker info` confirmou disponibilidade; uma nova execução isolada, sem mudar timeout/configuração/assertions, executou e aprovou os cinco. Evidências `api-target-types-inicial.*`, `docker-inicial-skipped.*` e `docker-segundo-skipped.*` permanecem na pasta nova.

| Verificação | Resultado |
|---|---|
| Backend build e worker build | Aprovados |
| Backend tipos `tsc -p tsconfig.json --noEmit` | Aprovado; testes também tipados pelo ts-jest |
| Frontend tipos `tsc -b` | Aprovado |
| Frontend build Vite `--configLoader native` | Aprovado; preview usado no Playwright |
| Lint backend/frontend | Zero erros; backend conserva 21 avisos, frontend sem avisos reportados |
| Prisma validate e migrate status | Aprovados; três migrações aplicadas no banco novo, sem pendências |
| Build padrão Vite/esbuild | Não repetido nesta etapa; falha de acesso a diretórios já documentada na verificação anterior |

## 7. Chamadas reais e preservação histórica

**Nenhuma chamada real nova à OpenAI foi necessária.** Consumo/custo adicional dessa API nesta tarefa: zero. A chave configurada não foi alterada; testes usam credencial e respostas sintéticas. Auditoria/cálculo de custos da implementação existente foram conservados.

Os 120 quizzes históricos, a distribuição posterior 17/12/17/14, as seis inconsistências, os 13 bloqueios e as 47 pendências continuam sendo resultados da campanha anterior. **Não foram republicados, corrigidos para melhorar a amostra, reclassificados como aprovados ou pedagogicamente validados.** O relatório novo altera a descrição do produto atual, não os resultados históricos. Os arquivos anteriores foram conferidos sem diferenças no Git e têm hashes de preservação registrados.

## 8. Limitações remanescentes

Revisão de IA e regras heurísticas podem falhar, como demonstram os seis erros da amostra histórica. Publicação automática não exige parecer humano e pode disponibilizar um erro que passe por todas as verificações. Não há prova de qualidade pedagógica, aprendizagem/motivação, usabilidade com humanos, segurança absoluta ou cobertura integral.

Não se testou disponibilidade atual da OpenAI/SMTP nem deploy. Banco testado é MariaDB, não MySQL 8. O teste do agendador invoca seu método, não observa disparo do relógio em produção. Concorrência entre processos pode gerar chamadas redundantes, embora a publicação seja protegida pela chave. Falha completa de geração retorna indisponibilidade; consultas posteriores podem iniciar novo lote limitado de tentativas, conforme o fluxo sob demanda existente.

Permanece a limitação conhecida do build padrão neste host, com carregador nativo verificado; backend conserva 21 avisos. O checksum da migração inicial previamente alterada não foi modificado nesta tarefa: atenção a instalações antigas continua aplicável. Não houve novos testes extensos de carga, segurança ou amostragem de IA.

## 9. Atualizações necessárias no TCC

| Seção | Resumo factual a atualizar |
|---|---|
| **4.5.7 — Geração com IA** | Descrever publicação automática após validação estrutural, revisor automatizado e embaralhamento, sem fila humana obrigatória; preservar auditoria/limites/idempotência. Substituir descrição de `human` como padrão da versão atual. |
| **5.4 — Avaliação da geração** | Conservar os resultados históricos e seus erros/pendências; distinguir amostra isolada de operação diária atual. Acrescentar regressões determinísticas de publicação automática, falha/retry e preservação histórica. Não afirmar nova amostra real nem aprovação dos 47 pendentes. |
| **5.5 — Discussão** | Explicar consistência do fluxo automático e os limites da revisão por IA. A ausência de intervenção humana é decisão de funcionamento da plataforma, não evidência de correção pedagógica. |
| **6.2 — Limitações** | Registrar possibilidade de erros passarem pela validação automatizada, ausência de avaliação humana/estudo educacional, mocks da nova verificação e disponibilidade externa não retestada. |

O Google Docs e esses capítulos não foram editados. Os relatórios anteriores continuam válidos como registros das versões que avaliaram, mas sua descrição de publicação humana padrão não caracteriza mais `938db7b`.

## 10. Encerramento

Comandos/resultados reproduzíveis: [COMANDOS.md](evidencias-quiz-automatico/COMANDOS.md). Identidade, hashes e preservação: [versão avaliada](evidencias-quiz-automatico/versao-avaliada.json). A instância MariaDB sintética e o preview foram encerrados; arquivos sintéticos foram conservados. O Docker preexistente foi mantido. Conferência final sem correspondência com os valores sensíveis configurados, sem alterações de produção, credenciais, evidências antigas, push ou deploy.
