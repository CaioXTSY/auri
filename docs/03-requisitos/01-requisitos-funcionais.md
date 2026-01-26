# 3.1 Requisitos Funcionais

## RF01 - Gestão de Usuários

### RF01.1 - Cadastro de Usuário
**Descrição**: Sistema deve permitir cadastro de novos usuários.

**Ator**: Não autenticado

**Entrada**:
- Nome completo
- Email institucional
- Senha
- Tipo de perfil (Professor/Aluno)
- Foto (opcional)

**Processo**:
- Validar formato de email
- Validar força da senha (min 8 caracteres, 1 maiúscula, 1 número)
- Verificar email não duplicado
- Criptografar senha (bcrypt)
- Enviar email de confirmação

**Saída**: Usuário criado com status "pendente confirmação"

**Prioridade**: Essencial

---

### RF01.2 - Login
**Descrição**: Usuário pode fazer login na plataforma.

**Ator**: Usuário cadastrado

**Entrada**: Email + Senha

**Processo**:
- Verificar credenciais
- Verificar conta confirmada
- Gerar JWT token
- Registrar log de acesso

**Saída**: Token JWT válido por 24h

**Prioridade**: Essencial

---

### RF01.3 - Recuperação de Senha
**Descrição**: Usuário esquecido pode recuperar senha.

**Ator**: Usuário cadastrado

**Fluxo**:
1. Usuário informa email
2. Sistema envia link de reset (válido por 1h)
3. Usuário cria nova senha
4. Sistema atualiza senha e invalida link

**Prioridade**: Essencial

---

### RF01.4 - Edição de Perfil
**Descrição**: Usuário pode editar seus dados pessoais.

**Campos editáveis**:
- Nome
- Foto/avatar
- Bio (máx 200 caracteres)
- Preferências de notificação

**Prioridade**: Importante

---

## RF02 - Gestão de Disciplinas

### RF02.1 - Criar Disciplina
**Descrição**: Professor pode criar nova disciplina.

**Ator**: Professor

**Entrada**:
- Nome da disciplina
- Código (ex: CC101)
- Descrição
- Linguagem de programação principal
- Carga horária
- Período letivo

**Saída**: Disciplina criada com ID único

**Prioridade**: Essencial

---

### RF02.2 - Criar Turma
**Descrição**: Professor pode criar turmas para uma disciplina.

**Ator**: Professor

**Entrada**:
- Disciplina (FK)
- Semestre/Ano
- Turma (ex: A, B, Noturno)
- Horários
- Limite de alunos (opcional)

**Saída**: Turma criada

**Prioridade**: Essencial

---

### RF02.3 - Associar Alunos à Turma
**Descrição**: Professor pode adicionar alunos à turma.

**Ator**: Professor

**Métodos**:
1. **Manual**: buscar e adicionar aluno por email
2. **Código de acesso**: gerar código, alunos se inscrevem
3. **Upload CSV**: importar lista de alunos

**Saída**: Alunos vinculados à turma

**Prioridade**: Essencial

---

### RF02.4 - Visualizar Turma
**Descrição**: Professor e alunos podem ver informações da turma.

**Professor vê**:
- Lista completa de alunos
- Estatísticas de engajamento
- Atividades criadas

**Aluno vê**:
- Colegas da turma (se permitido)
- Atividades da turma
- Calendário

**Prioridade**: Essencial

---

## RF03 - Atividades e Desafios

### RF03.1 - Criar Atividade Manualmente
**Descrição**: Professor cria atividade do zero.

**Ator**: Professor

**Tipos de atividade**:
1. Exercício prático (código)
2. Quiz teórico
3. Desafio semanal
4. Missão gamificada

**Campos**:
- Título
- Descrição/enunciado
- Tipo
- Dificuldade (Fácil/Médio/Difícil)
- Pontuação
- Prazo
- Arquivos anexos (opcional)
- Casos de teste (se código)

**Saída**: Atividade criada com status "rascunho"

**Prioridade**: Essencial

---

### RF03.2 - Publicar Atividade
**Descrição**: Professor publica atividade para turma.

**Ator**: Professor

**Processo**:
- Validar campos obrigatórios
- Definir turma(s) destino
- Definir data de liberação (opcional)
- Enviar notificação aos alunos

**Saída**: Atividade visível para alunos

**Prioridade**: Essencial

---

### RF03.3 - Submeter Solução
**Descrição**: Aluno submete resposta para atividade.

**Ator**: Aluno

**Entrada**:
- Código-fonte (se exercício)
- Respostas (se quiz)
- Link/arquivo (se projeto)

**Processo**:
- Validar prazo
- Salvar submissão com timestamp
- Executar testes (se houver)
- Calcular pontos iniciais

**Saída**: Submissão registrada

**Prioridade**: Essencial

---

### RF03.4 - Reenvio de Atividade
**Descrição**: Aluno pode reenviar solução se permitido.

**Regras**:
- Professor define se permite reenvio
- Professor define limite de tentativas
- Pode ter penalidade de pontos

**Prioridade**: Importante

---

### RF03.5 - Feedback do Professor
**Descrição**: Professor fornece feedback textual em submissão.

**Ator**: Professor

**Entrada**:
- Comentários gerais
- Comentários inline (no código)
- Sugestões de melhoria
- Nota (se aplicável)

**Saída**: Aluno recebe notificação de feedback

**Prioridade**: Essencial

---

## RF04 - Uso de IA

### RF04.1 - Gerar Exercícios com IA
**Descrição**: Professor solicita geração de exercícios.

**Ator**: Professor

**Fluxo**:
1. Professor define parâmetros (linguagem, tema, dificuldade)
2. IA gera sugestões
3. Professor visualiza e edita
4. Professor aprova ou rejeita
5. Se aprovado, pode publicar

**Prioridade**: Importante

---

### RF04.2 - Gerar Quiz com IA
**Descrição**: Professor solicita geração de quiz.

**Similar ao RF04.1**, mas para questões teóricas.

**Prioridade**: Importante

---

### RF04.3 - Gerar Desafios Semanais
**Descrição**: IA sugere desafios mais complexos.

**Prioridade**: Desejável

---

### RF04.4 - Gerar Missões Gamificadas
**Descrição**: IA sugere missões diárias/semanais.

**Prioridade**: Desejável

---

### RF04.5 - Histórico de Uso de IA
**Descrição**: Professor vê histórico de gerações de IA.

**Informações**:
- Data/hora
- Tipo de geração
- Parâmetros usados
- Aprovado/Rejeitado
- Se publicado

**Prioridade**: Importante

---

## RF05 - Gamificação

### RF05.1 - Ganhar Pontos
**Descrição**: Sistema atribui pontos por ações do aluno.

**Fontes de pontos**:
- Submissão de atividade
- Nota da atividade
- Participação (comentários, ajuda)
- Missões completas
- Bônus por antecipação

**Processo**: Automático ao completar ação

**Prioridade**: Essencial

---

### RF05.2 - Progressão de Nível
**Descrição**: Aluno sobe de nível ao acumular XP.

**Processo**:
- XP = pontos acumulados
- Curva de XP por nível (progressiva)
- Notificação ao subir de nível
- Desbloqueio de benefícios

**Prioridade**: Essencial

---

### RF05.3 - Conquistas (Badges)
**Descrição**: Aluno desbloqueia badges por feitos específicos.

**Tipos**:
- Primeira entrega
- Streak de dias
- Top ranking
- Maestria em tópico

**Processo**: Sistema verifica critérios automaticamente

**Prioridade**: Essencial

---

### RF05.4 - Ranking
**Descrição**: Exibir ranking de alunos.

**Tipos**:
- Ranking da turma (semanal, mensal, semestral)
- Ranking global (opcional)

**Opções**:
- Modo anônimo (aluno vê posição mas não identidade)
- Modo privado (não participa de rankings públicos)

**Prioridade**: Importante

---

### RF05.5 - Visualizar Progresso
**Descrição**: Aluno vê seu progresso visual.

**Informações**:
- Pontos totais
- Nível atual e próximo
- Badges conquistadas
- Posição no ranking
- Gráfico de evolução

**Prioridade**: Essencial

---

## RF06 - Missões

### RF06.1 - Criar Missão Manual
**Descrição**: Professor cria missão personalizada.

**Ator**: Professor

**Tipos**:
- Diária
- Semanal
- Única

**Campos**:
- Nome
- Descrição
- Critério de conclusão
- Recompensa (pontos/badges)
- Prazo

**Prioridade**: Importante

---

### RF06.2 - Missões Automáticas
**Descrição**: Sistema gera missões padrão automaticamente.

**Exemplos**:
- "Complete 1 atividade hoje"
- "Alcance 50 pontos esta semana"
- "Mantenha streak de 7 dias"

**Prioridade**: Desejável

---

### RF06.3 - Completar Missão
**Descrição**: Sistema detecta conclusão de missão.

**Processo**:
- Monitorar ações do aluno
- Verificar critério de missão
- Marcar como completa
- Atribuir recompensa
- Notificar aluno

**Prioridade**: Importante

---

## RF07 - Dashboards

### RF07.1 - Dashboard do Aluno
**Descrição**: Visão geral do progresso do aluno.

**Informações**:
- Pontos e nível
- Atividades pendentes
- Missões ativas
- Últimas conquistas
- Gráfico de evolução
- Próximo no ranking

**Prioridade**: Essencial

---

### RF07.2 - Dashboard do Professor
**Descrição**: Visão geral da turma.

**Informações**:
- Taxa de entrega de atividades
- Média de pontos
- Atividades mais ignoradas
- Alunos inativos
- Distribuição de notas
- Engajamento por semana

**Prioridade**: Essencial

---

### RF07.3 - Relatórios Exportáveis
**Descrição**: Professor exporta dados da turma.

**Formatos**:
- CSV
- PDF

**Dados**:
- Notas por aluno
- Histórico de submissões
- Estatísticas de engajamento

**Prioridade**: Importante

---

## RF08 - Configurações

### RF08.1 - Configurar Gamificação
**Descrição**: Professor ajusta parâmetros de gamificação.

**Configurações**:
- Ativar/desativar
- Pesos de pontuação
- Curva de XP
- Regras de ranking
- Penalidades

**Prioridade**: Importante

---

### RF08.2 - Configurar Notificações
**Descrição**: Usuário escolhe quais notificações receber.

**Opções**:
- Email
- In-app
- Tipos de evento

**Prioridade**: Importante

---

## RF09 - Notificações

### RF09.1 - Notificações em Tempo Real
**Descrição**: Usuário recebe notificações in-app.

**Eventos**:
- Nova atividade publicada
- Prazo próximo
- Feedback recebido
- Conquista desbloqueada
- Mensagem do professor

**Prioridade**: Importante

---

### RF09.2 - Notificações por Email
**Descrição**: Sistema envia emails para eventos importantes.

**Prioridade**: Desejável

---

## RF10 - Histórico e Auditoria

### RF10.1 - Histórico de Submissões
**Descrição**: Aluno vê histórico de todas suas tentativas.

**Informações**:
- Data/hora
- Código submetido
- Resultado de testes
- Pontos obtidos
- Feedback

**Prioridade**: Importante

---

### RF10.2 - Log de Ações
**Descrição**: Sistema registra ações importantes.

**Para auditoria**:
- Login/logout
- Criação/edição de atividades
- Uso de IA
- Alterações de nota

**Prioridade**: Importante

---

## RF11 - Administração

### RF11.1 - Painel Admin
**Descrição**: Admin gerencia plataforma.

**Funcionalidades**:
- Gerenciar usuários
- Ver estatísticas globais
- Configurações do sistema
- Logs de erro

**Prioridade**: Desejável

---

## Resumo de Prioridades

### Essencial (MVP)
- RF01.1, RF01.2, RF01.3
- RF02.1, RF02.2, RF02.3, RF02.4
- RF03.1, RF03.2, RF03.3, RF03.5
- RF05.1, RF05.2, RF05.3, RF05.5
- RF07.1, RF07.2

### Importante
- RF01.4
- RF03.4
- RF04.1, RF04.2, RF04.5
- RF05.4
- RF06.1, RF06.3
- RF07.3
- RF08.1, RF08.2
- RF09.1
- RF10.1, RF10.2

### Desejável
- RF04.3, RF04.4
- RF06.2
- RF09.2
- RF11.1

**Total: 41 Requisitos Funcionais**
