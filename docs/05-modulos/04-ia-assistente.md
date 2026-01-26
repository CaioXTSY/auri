# 5.4 Módulo de IA Assistente

## ⚠️ Princípio Fundamental

**A IA NÃO substitui o professor. A IA é uma FERRAMENTA AUXILIAR.**

### O Que Isso Significa?

✅ **IA FAZ**:
- Gera sugestões de exercícios
- Cria quizzes teóricos
- Propõe desafios semanais
- Sugere mensagens motivacionais
- Economiza tempo do professor em tarefas repetitivas

❌ **IA NÃO FAZ**:
- Avaliar código do aluno
- Atribuir notas
- Tomar decisões pedagógicas finais
- Interagir diretamente com alunos sem supervisão
- Substituir feedback do professor

---

## Fluxo de Trabalho com IA

### Fluxo Correto (CRÍTICO PARA TCC)

```
1. Professor define requisitos
   ↓
2. IA gera sugestões
   ↓
3. Professor revisa e edita
   ↓
4. Professor aprova ou rejeita
   ↓
5. Se aprovado: Professor publica
```

**Este fluxo te protege academicamente** pois demonstra que:
- Professor mantém controle total
- IA é ferramenta, não decisor
- Uso é ético e responsável

---

## 1. Geração de Questões de Programação

### 1.1 Interface para o Professor

```
┌─────────────────────────────────────┐
│ 🤖 Gerar Questões com IA            │
├─────────────────────────────────────┤
│ Linguagem:     [Python ▼]           │
│ Dificuldade:   [● Fácil ○ Médio]    │
│ Tema:          [Loops]               │
│ Quantidade:    [3]                   │
│                                      │
│ [Gerar Sugestões]                    │
└─────────────────────────────────────┘
```

### 1.2 Parâmetros de Entrada

```typescript
interface QuestionGenerationRequest {
  language: 'Python' | 'Java' | 'C' | 'JavaScript' | 'C++';
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string; // ex: "loops", "arrays", "recursion"
  quantity: number; // 1-10
  context?: string; // contexto adicional do professor
}
```

### 1.3 Prompt para IA

```
Você é um assistente especializado em criar exercícios de programação.

Gere {quantity} exercícios de {language} sobre {topic}.
Dificuldade: {difficulty}
Contexto adicional: {context}

Para cada exercício, forneça:
1. Título curto e descritivo
2. Descrição do problema
3. Exemplos de entrada e saída
4. Restrições (limites, condições)
5. Dicas (opcional)
6. Solução de referência (comentada)
7. Casos de teste

Formato JSON:
{
  "exercises": [
    {
      "title": "...",
      "description": "...",
      "examples": [...],
      "constraints": [...],
      "hints": [...],
      "solution": "...",
      "testCases": [...]
    }
  ]
}
```

### 1.4 Visualização das Sugestões

```
┌────────────────────────────────────────────────┐
│ 📝 Sugestões Geradas (3)                       │
├────────────────────────────────────────────────┤
│                                                 │
│ [1] Soma de Números Pares                      │
│     Escreva um programa que...                  │
│     [Visualizar] [Editar] [Aprovar] [Rejeitar] │
│                                                 │
│ [2] Contagem de Vogais                         │
│     Dado uma string, conte...                   │
│     [Visualizar] [Editar] [Aprovar] [Rejeitar] │
│                                                 │
│ [3] Maior Elemento de Lista                    │
│     Encontre o maior elemento...                │
│     [Visualizar] [Editar] [Aprovar] [Rejeitar] │
│                                                 │
│ [Gerar Mais] [Aprovar Todos] [Rejeitar Todos]  │
└────────────────────────────────────────────────┘
```

### 1.5 Edição Antes de Publicar

Professor pode:
- ✏️ Editar título e descrição
- 🔧 Ajustar exemplos
- ➕ Adicionar dicas
- 📝 Modificar casos de teste
- 🎯 Ajustar pontuação

---

## 2. Geração de Quizzes Teóricos

### 2.1 Interface

```
┌─────────────────────────────────────┐
│ 🤖 Gerar Quiz com IA                │
├─────────────────────────────────────┤
│ Tema:          [POO em Python]       │
│ Subtópicos:    [Classes, Herança]    │
│ Nº Questões:   [10]                  │
│ Tipos:         [☑ Múltipla escolha]  │
│                [☑ Verdadeiro/Falso]  │
│                [☐ Dissertativa]      │
│                                      │
│ [Gerar Quiz]                         │
└─────────────────────────────────────┘
```

### 2.2 Prompt para IA

```
Crie um quiz de {quantity} questões sobre {topic}.
Subtópicos: {subtopics}
Tipos de questão: {types}

Para cada questão:
1. Enunciado claro
2. Opções (se múltipla escolha)
3. Resposta correta
4. Explicação da resposta
5. Nível de dificuldade
6. Tempo estimado

Formato JSON.
```

### 2.3 Exemplo de Saída

```json
{
  "quiz": {
    "title": "Quiz: POO em Python",
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "question": "O que é encapsulamento em POO?",
        "options": [
          "Ocultar detalhes de implementação",
          "Criar várias classes",
          "Herdar de outras classes",
          "Usar funções"
        ],
        "correctAnswer": 0,
        "explanation": "Encapsulamento é o conceito de...",
        "difficulty": "easy",
        "estimatedTime": 30
      }
    ]
  }
}
```

---

## 3. Geração de Desafios Semanais

### 3.1 Conceito

Desafios semanais são atividades mais complexas que:
- Integram múltiplos conceitos
- Têm prazo de 1 semana
- São opcionais mas recompensadores
- Gamificação: pontos bônus, badges

### 3.2 Prompt para IA

```
Crie um desafio semanal de programação em {language}.

Requisitos:
- Tema: {topic}
- Nível dos alunos: {studentLevel}
- Deve integrar conceitos: {concepts}
- Estimativa: 2-4 horas de trabalho

Estrutura:
1. História/contexto interessante
2. Problema a ser resolvido
3. Requisitos funcionais
4. Requisitos técnicos
5. Critérios de avaliação
6. Bônus (funcionalidades extras)
7. Recursos de aprendizado

Torne o desafio engajante!
```

### 3.3 Exemplo de Desafio Gerado

```markdown
# 🎮 Desafio Semanal: Jogo da Velha Inteligente

## História
Você foi contratado para criar uma versão digital
do clássico jogo da velha...

## Objetivos
- [ ] Implementar tabuleiro 3x3
- [ ] Jogador vs. Jogador
- [ ] Detecção de vitória
- [ ] IA básica (bônus)

## Requisitos Técnicos
- Python 3.8+
- Interface de texto ou GUI
- Código documentado

## Critérios de Avaliação
- Funcionalidade: 40%
- Código limpo: 30%
- Criatividade: 20%
- Bônus: 10%

## Bônus
🌟 IA que joga perfeitamente
🌟 Interface gráfica
🌟 Replay de partidas

## Recursos
- [Tutorial de Pygame](...)
- [Algoritmo Minimax](...)
```

---

## 4. Geração de Missões Gamificadas

### 4.1 Tipos de Missões

**Missões Diárias** (simples, rápidas)
- "Complete 1 exercício fácil"
- "Revise um conceito de aula"
- "Ajude um colega no fórum"

**Missões Semanais** (mais complexas)
- "Complete 5 exercícios sobre loops"
- "Alcance 100 pontos esta semana"
- "Suba 1 nível"

### 4.2 Prompt para IA

```
Gere {quantity} missões {frequency} para alunos de {language}.

Contexto:
- Nível médio da turma: {level}
- Tópico atual: {currentTopic}
- Objetivos pedagógicos: {goals}

Para cada missão:
1. Nome criativo
2. Descrição clara
3. Critério de conclusão
4. Recompensa (pontos/badges)
5. Dificuldade estimada

Torne as missões motivadoras!
```

### 4.3 Exemplo de Missões Geradas

```json
{
  "missions": [
    {
      "name": "🔥 Streak de Ouro",
      "description": "Complete pelo menos 1 atividade por dia durante 7 dias",
      "type": "daily_streak",
      "target": 7,
      "reward": {
        "points": 50,
        "badge": "streak_7"
      },
      "difficulty": "medium"
    },
    {
      "name": "🎯 Mestre dos Loops",
      "description": "Resolva 10 exercícios sobre estruturas de repetição",
      "type": "topic_mastery",
      "target": 10,
      "reward": {
        "points": 100,
        "badge": "loop_master"
      },
      "difficulty": "easy"
    }
  ]
}
```

---

## 5. Mensagens Motivacionais

### 5.1 Contextos

A IA pode gerar mensagens para:
- **Boas-vindas**: início de semestre
- **Incentivo**: aluno está inativo
- **Celebração**: conquista desbloqueada
- **Recuperação**: aluno com dificuldades
- **Marcos**: fim de módulo, meio de semestre

### 5.2 Prompt para IA

```
Gere uma mensagem motivacional para:

Contexto: {context}
Aluno: {studentName}
Situação: {situation}
Tom: {tone} (ex: encorajador, celebratório, suportivo)

Requisitos:
- Personalizada (usar nome do aluno)
- Positiva e encorajadora
- Curta (max 100 palavras)
- Relacionada à programação
- Sem clichês óbvios
```

### 5.3 Exemplos

**Aluno inativo há 5 dias:**
```
Olá, João! 👋

Notei que você não aparece por aqui faz alguns dias.
Tudo bem? Lembre-se: programação é como ir à academia,
consistência é mais importante que intensidade.

Que tal voltar com um exercício fácil hoje? 
Você está a apenas 1 desafio de manter seu streak!

Estamos aqui se precisar de ajuda. 💪
```

**Conquistou badge:**
```
🎉 Parabéns, Maria!

Você acabou de desbloquear a badge "Mestre dos Loops"!
Isso mostra dedicação e progresso real.

Continue assim e logo estará dominando estruturas
de dados mais avançadas!

Próximo desafio: Recursão. Preparada? 🚀
```

---

## 6. Configurações e Controle

### 6.1 Painel do Professor

```
┌─────────────────────────────────────────┐
│ ⚙️ Configurações de IA                   │
├─────────────────────────────────────────┤
│                                          │
│ Uso de IA nesta disciplina:              │
│ [☑] Ativado                              │
│                                          │
│ Funcionalidades habilitadas:             │
│ [☑] Geração de exercícios                │
│ [☑] Geração de quizzes                   │
│ [☑] Sugestão de desafios                 │
│ [☑] Missões automáticas                  │
│ [☐] Mensagens motivacionais (beta)       │
│                                          │
│ Aprovação automática:                    │
│ [☐] Publicar sugestões sem revisão       │
│     ⚠️ Não recomendado                   │
│                                          │
│ Histórico de uso:                        │
│ - 47 exercícios gerados (42 aprovados)   │
│ - 12 quizzes gerados (11 aprovados)      │
│ - 8 desafios gerados (7 publicados)      │
│                                          │
│ [Ver Histórico Completo]                 │
└─────────────────────────────────────────┘
```

### 6.2 Limites de Uso

Para evitar abuso e custos:
- **Por professor**: 50 gerações/dia
- **Por disciplina**: 200 gerações/mês
- **Rate limiting**: 1 req/10s

### 6.3 Auditoria

Todas as interações com IA são registradas:
```sql
CREATE TABLE ai_usage_log (
  id SERIAL PRIMARY KEY,
  professor_id INT REFERENCES users(id),
  action VARCHAR(50), -- generate_exercise, generate_quiz, etc
  parameters JSONB,
  generated_content JSONB,
  approved BOOLEAN,
  published BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. Implementação Técnica

### 7.1 Arquitetura

```
Frontend (Professor)
    ↓
API Backend
    ↓
AI Service Layer
    ↓
External AI API (OpenAI, etc)
```

### 7.2 Endpoints da API

```typescript
// Gerar exercícios
POST /api/ai/generate/exercises
Body: QuestionGenerationRequest
Response: { exercises: Exercise[] }

// Gerar quiz
POST /api/ai/generate/quiz
Body: QuizGenerationRequest
Response: { quiz: Quiz }

// Gerar desafio
POST /api/ai/generate/challenge
Body: ChallengeGenerationRequest
Response: { challenge: Challenge }

// Gerar missões
POST /api/ai/generate/missions
Body: MissionGenerationRequest
Response: { missions: Mission[] }

// Aprovar sugestão
POST /api/ai/approve/:suggestionId
Body: { edits?: any }

// Rejeitar sugestão
POST /api/ai/reject/:suggestionId
Body: { reason?: string }
```

### 7.3 Service Layer

```typescript
class AIService {
  async generateExercises(params: QuestionGenerationRequest): Promise<Exercise[]> {
    // 1. Validar parâmetros
    // 2. Construir prompt
    // 3. Chamar API externa
    // 4. Parsear resposta
    // 5. Validar formato
    // 6. Salvar como "pendente"
    // 7. Retornar sugestões
  }

  async approveAndPublish(suggestionId: number, edits?: any): Promise<void> {
    // 1. Buscar sugestão
    // 2. Aplicar edições do professor
    // 3. Marcar como aprovada
    // 4. Publicar como atividade real
    // 5. Registrar na auditoria
  }
}
```

---

## 8. Integração com APIs de IA

### 8.1 Opções de API

**OpenAI (GPT-4)**
- ✅ Qualidade alta
- ❌ Custo moderado
- ✅ Documentação excelente

**Anthropic (Claude)**
- ✅ Contexto longo
- ✅ Segurança
- ❌ Custo similar

**Google (Gemini)**
- ✅ Grátis (com limites)
- ✅ Boa qualidade
- ⚠️ Limitações de uso

**Alternativa Local** (Llama, Mistral)
- ✅ Sem custo de API
- ❌ Requer infraestrutura
- ⚠️ Qualidade variável

### 8.2 Implementação Multi-Provider

```typescript
interface AIProvider {
  generateCompletion(prompt: string, options: any): Promise<string>;
}

class OpenAIProvider implements AIProvider { ... }
class AnthropicProvider implements AIProvider { ... }
class LocalProvider implements AIProvider { ... }

// Factory pattern
class AIProviderFactory {
  static create(type: 'openai' | 'anthropic' | 'local'): AIProvider {
    // ...
  }
}
```

---

## 9. Aspectos Éticos e Legais

### 9.1 Transparência

- ✅ Avisar alunos que conteúdo pode ser gerado por IA
- ✅ Documentar uso em materiais acadêmicos
- ✅ Professor sempre responsável final

### 9.2 Privacidade

- ❌ NÃO enviar dados de alunos para IA
- ✅ Apenas contexto pedagógico genérico
- ✅ Anonimizar qualquer exemplo

### 9.3 Qualidade

- ✅ Professor SEMPRE revisa antes de publicar
- ✅ Feedback loop: melhorar prompts com uso
- ✅ Métricas: taxa de aprovação de sugestões

---

## 10. Justificativa para TCC

### Por Que Usar IA Assim é Válido?

1. **Professor no Controle**
   - IA não toma decisões
   - Professor valida tudo
   - Uso é transparente

2. **Benefício Pedagógico**
   - Economiza tempo do professor
   - Professor foca em feedback de qualidade
   - Mais variedade de exercícios

3. **Ético e Responsável**
   - Uso documentado
   - Auditável
   - Alinhado com boas práticas

4. **Inovador mas Fundamentado**
   - Área de pesquisa ativa: AI in Education
   - Contribui para discussão de uso ético
   - Diferencial do projeto

---

## Conclusão

O módulo de IA é desenhado para ser:
- **Assistencial**: ajuda o professor, não substitui
- **Transparente**: uso claro e documentado
- **Controlado**: professor sempre aprova
- **Ético**: sem substituir avaliação humana
- **Justificável academicamente**: fundamentação clara

Este design protege o TCC de críticas sobre "automatização excessiva" e demonstra uso responsável de IA na educação.
