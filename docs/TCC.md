# TCC - Plataforma Gamificada de Apoio ao Ensino de Programação

## 🎯 Visão Geral do Sistema

Plataforma web gamificada para apoio ao ensino de programação, com:

- Gestão de disciplinas
- Desafios e atividades
- Sistema de gamificação
- Dashboards analíticos
- IA somente como assistente do professor

---

## 👥 Módulo de Usuários e Acesso

### Perfis de Usuário

- **👨‍🏫 Professor**: Gerencia disciplinas, turmas e atividades
- **👨‍🎓 Aluno**: Participa das atividades e acompanha seu progresso
- **🛠️ Admin**: Gerencia o sistema (opcional)

### Funcionalidades

- Cadastro e login
- Autenticação JWT
- Recuperação de senha
- Controle de permissões por perfil
- Edição de perfil
- Upload de foto/avatar do usuário

---

## 📚 Módulo de Disciplinas e Turmas

### Funcionalidades Principais

- Criar disciplina
- Criar turmas por semestre
- Associar alunos à turma
- Definir linguagem da disciplina (ex: Python, C, Java)
- Calendário da turma
- Status da disciplina (ativa / encerrada)

---

## 🧩 Módulo de Atividades e Desafios

### Tipos de Atividades

- Exercícios práticos
- Questionários (quiz)
- Desafios semanais
- Missões gamificadas

### Funcionalidades

- Criar atividade manualmente
- Definir parâmetros:
  - Prazo de entrega
  - Nível de dificuldade
  - Pontuação
- Atividades individuais ou em grupo
- Controle de reenvio
- Feedback textual do professor
- Histórico de tentativas

---

## 🤖 Módulo de IA (Uso Controlado e Justificável)

### ⚠️ Princípios Fundamentais

> **A IA NÃO avalia aluno**  
> **A IA NÃO gera nota**

### Usos Permitidos da IA

A IA é utilizada **exclusivamente** para auxiliar o professor em:

- ✨ **Gerar questões de programação**
  - Níveis: fácil / médio / difícil
  - Por linguagem de programação

- ✨ **Gerar quizzes teóricos**

- ✨ **Criar desafios semanais**

- ✨ **Sugerir missões gamificadas**
  - Exemplo: "complete 3 exercícios até sexta-feira"

- ✨ **Sugerir descrições motivacionais**
  - Textos de incentivo
  - Mensagens de progresso

### Fluxo de Trabalho com IA

```
IA sugere → Professor revisa → Professor publica
```

> 💡 **Importante para o TCC**: Este fluxo garante que a decisão final sempre pertence ao professor, mantendo a integridade acadêmica do processo.

---

## 🎮 Módulo de Gamificação (CORE DO PROJETO)

### Sistema de Pontos

**Ganho de pontos por:**
- Entrega de atividades
- Participação ativa
- Conclusão de desafios extras
- Penalidade opcional por atraso

### Sistema de Níveis

- Níveis progressivos
- Curva de progressão configurável
- Visualização gráfica do progresso

### Conquistas (Badges)

- Primeira entrega
- Sequência de entregas consecutivas
- Desafios concluídos
- Participação contínua

### Ranking

- **Ranking por turma**: Competição saudável entre colegas
- **Ranking semanal**: Acompanhamento de curto prazo
- **Ranking geral**: Visão macro do desempenho
- **Opção de anonimização**: Respeito à privacidade (ética 👌)

---

## 🗓️ Módulo de Missões e Rotina

### Tipos de Missões

- **Diárias**: Incentivo à prática constante
- **Semanais**: Metas de médio prazo
- **Personalizadas**: Criadas pelo professor

### Funcionalidades

- Missões automáticas (ex: estudar 30 min/dia)
- Missões criadas manualmente pelo professor
- Missões geradas com apoio da IA
- Controle de conclusão
- Recompensas configuráveis

---

## 📊 Módulo de Dashboard e Visualização de Dados

### Dashboard do Aluno

- Pontos acumulados
- Nível atual
- Conquistas desbloqueadas
- Atividades pendentes
- Gráficos de evolução pessoal

### Dashboard do Professor

- Engajamento da turma
- Taxa de entrega de atividades
- Atividades mais ignoradas/difíceis
- Evolução individual por aluno
- Exportação de relatórios (CSV/PDF)

---

## 🧠 Módulo de Configurações Pedagógicas

- Ativar/desativar gamificação
- Ajustar pesos de pontuação
- Definir regras de ranking
- Configurar tipos de missões
- Ajustar dificuldade sugerida pela IA

---

## 🔔 Módulo de Notificações

### Notificações In-App

- Avisos de prazo próximo
- Conquistas desbloqueadas
- Novas missões disponíveis
- Mensagens motivacionais (IA opcional)

---

## 🗄️ Módulo de Histórico e Auditoria

- Histórico de ações do aluno
- Histórico de atividades realizadas
- Logs de uso da IA
- Controle de alterações do professor
- Rastreabilidade completa das ações

---

## 🧱 Arquitetura Backend

### Tecnologias e Padrões

- **API REST**: Comunicação padronizada
- **Documentação automática**: Swagger/OpenAPI
- **Arquitetura em camadas**:
  - Controllers
  - Services
  - Repositories
- **Banco de dados relacional**
- **Versionamento de API**
- **Docker**: Containerização

---

## 🎨 Arquitetura Frontend

### Tecnologias

- **SPA (Single Page Application)**: React
- **Layout responsivo**: Design adaptável
- **Sistema de rotas**: Navegação fluida
- **Consumo da API REST**
- **Estados globais**: Gerenciamento de estado
- **Gráficos interativos**: Visualização de dados
- **Feedback visual**: Indicadores de progresso

---

## 📋 Resumo dos Módulos

| Módulo | Descrição | Prioridade |
|--------|-----------|------------|
| Usuários e Acesso | Autenticação e perfis | Alta |
| Disciplinas e Turmas | Gestão acadêmica | Alta |
| Atividades e Desafios | Core pedagógico | Alta |
| IA (Assistente) | Suporte ao professor | Média |
| Gamificação | Diferencial do projeto | Alta |
| Missões e Rotina | Engajamento contínuo | Média |
| Dashboard | Visualização de dados | Alta |
| Configurações | Customização | Média |
| Notificações | Comunicação | Baixa |
| Histórico e Auditoria | Rastreabilidade | Média |

---

**Última atualização**: Janeiro de 2026
