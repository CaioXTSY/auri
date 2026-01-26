# 5.5 Módulo de Gamificação

## Visão Geral

O módulo de gamificação é o **coração motivacional** da plataforma. Diferente de gamificação superficial (apenas pontos por tarefas), este módulo implementa mecânicas baseadas em teorias de aprendizagem e psicologia motivacional.

---

## 1. Sistema de Pontos

### 1.1 Fontes de Pontuação

#### Atividades Obrigatórias
```
Pontos Base = (Dificuldade × Peso) × Multiplicador Temporal

Dificuldade:
- Fácil: 10 pontos
- Médio: 25 pontos
- Difícil: 50 pontos
- Desafio: 100 pontos

Multiplicador Temporal:
- Entrega antecipada (>3 dias): 1.5x
- Entrega no prazo: 1.0x
- Entrega atrasada (1-3 dias): 0.7x
- Entrega muito atrasada (>3 dias): 0.5x
```

#### Atividades Extras
- Desafios opcionais: +30 pontos
- Exercícios bônus: +15 pontos
- Contribuições (ex: ajudar colega): +10 pontos

#### Missões
- Missão diária completa: +5 pontos
- Sequência de 7 dias: +20 pontos bônus
- Sequência de 30 dias: +100 pontos bônus

#### Participação
- Comentário relevante: +2 pontos
- Pergunta bem formulada: +5 pontos
- Resposta útil a colega: +10 pontos

### 1.2 Penalidades Opcionais

O professor pode configurar:
- Penalidade por atraso: -X pontos por dia
- Penalidade por tentativas excessivas: -Y pontos após N tentativas
- Penalidade por plágio: perda total de pontos da atividade

### 1.3 Proteções

- **Piso de pontuação**: aluno nunca fica com pontos negativos
- **Teto por atividade**: limite máximo para evitar farming
- **Cooldown**: tempo mínimo entre ações pontuáveis repetidas

---

## 2. Sistema de Níveis

### 2.1 Progressão

#### Curva de Experiência
```
XP necessário para nível N = 100 × N × (1 + N/10)

Nível 1 → 2: 110 XP
Nível 2 → 3: 240 XP
Nível 3 → 4: 390 XP
...
Nível 9 → 10: 1900 XP
```

#### Nomenclatura dos Níveis

```
Nível 1-5: Iniciante 🌱
Nível 6-10: Aprendiz 📚
Nível 11-15: Desenvolvedor 💻
Nível 16-20: Expert 🚀
Nível 21-25: Mestre 👑
Nível 26+: Lendário ⭐
```

### 2.2 Benefícios por Nível

Cada nível desbloqueia:
- **Visual**: nova badge de nível
- **Funcional**: acesso a desafios avançados
- **Social**: destaque no ranking

Marcos especiais:
- **Nível 5**: Desbloqueia missões semanais avançadas
- **Nível 10**: Desbloqueia ranking global
- **Nível 15**: Desbloqueia desafios community
- **Nível 20**: Badge especial "Professor Assistente"

### 2.3 Visualização

- Barra de progresso visual com % até próximo nível
- Animação de "level up"
- Histórico de níveis alcançados

---

## 3. Sistema de Conquistas (Badges)

### 3.1 Categorias de Conquistas

#### Primeiros Passos
- 🎯 **Primeira Entrega**: Completou primeira atividade
- 🏃 **Sprint Inicial**: Completou 3 atividades na primeira semana
- 📝 **Apresentação**: Completou perfil com foto e bio

#### Consistência
- 🔥 **Streak 7**: 7 dias consecutivos com atividade
- 🔥 **Streak 30**: 30 dias consecutivos
- 🔥 **Streak 100**: 100 dias consecutivos
- ⏰ **Pontualidade**: 10 entregas antes do prazo
- 📅 **Sem Faltas**: Completou todas atividades do mês

#### Desempenho
- ⭐ **Perfeição**: Nota máxima em 5 atividades
- 🚀 **Velocista**: Completou atividade em <30 minutos
- 🧠 **Desafiador**: Completou 10 desafios difíceis
- 💡 **Problem Solver**: Resolveu problema complexo sem ajuda

#### Social
- 🤝 **Colaborador**: Ajudou 5 colegas
- 💬 **Comunicativo**: 20 comentários relevantes
- 👥 **Mentor**: Resposta foi marcada como útil 10 vezes

#### Especiais
- 🏆 **Top 3**: Ficou no top 3 do ranking
- 👑 **Campeão**: Ficou em 1º lugar
- 🎓 **Graduado**: Completou 100% da disciplina
- 🌟 **Lendário**: Alcançou nível 25

### 3.2 Raridade

- **Comum**: 50% dos alunos conquistam
- **Incomum**: 25% conquistam
- **Raro**: 10% conquistam
- **Épico**: 5% conquistam
- **Lendário**: <1% conquistam

### 3.3 Exibição

- Badge wall no perfil do aluno
- Badges recentes destacados no dashboard
- Notificação animada ao desbloquear
- Compartilhamento opcional (social feed futuro)

---

## 4. Sistema de Ranking

### 4.1 Tipos de Ranking

#### Ranking da Turma
- Comparação apenas com alunos da mesma turma
- Atualizado em tempo real
- Período: semanal, mensal, semestre completo

#### Ranking Semanal
- Reseta toda segunda-feira
- Foca em atividade recente
- Incentiva engajamento contínuo

#### Ranking Global (desbloqueia nível 10)
- Todos os alunos da plataforma
- Por disciplina ou geral
- Destaque para top 10

### 4.2 Cálculo de Posição

```
Score = (Pontos × 0.5) + (Níveis × 100) + (Badges Raros × 50)

Desempate:
1. Maior nível
2. Maior número de badges
3. Maior consistência (dias ativos)
4. Primeiro a alcançar a pontuação
```

### 4.3 Opções de Privacidade

**Modo Anônimo**:
- Aluno aparece como "Aluno #123"
- Ainda participa do ranking
- Não revela identidade

**Modo Privado**:
- Aluno não aparece em rankings públicos
- Professor ainda vê posição
- Apenas métricas pessoais visíveis

### 4.4 Visualização

- Lista top 10 destacada
- Posição do aluno sempre visível
- Diferença de pontos para próxima posição
- Indicador de tendência (↑↓→)

---

## 5. Feedback Visual e Animações

### 5.1 Micro-interações

#### Ganho de Pontos
```
+10 XP ✨
Animation: fade up + pulse
Duration: 1.5s
```

#### Level Up
```
🎉 LEVEL UP!
Você alcançou nível 5
Novo título: Aprendiz 📚
Animation: confetti + shake
Duration: 3s
```

#### Nova Badge
```
🏆 Nova Conquista!
Você ganhou: Streak 7 🔥
Rarity: Incomum
Animation: flip + glow
Duration: 2s
```

### 5.2 Barra de Progresso

- Sempre visível no topo do dashboard
- Animação smooth ao ganhar XP
- Mudança de cor por tier de nível

### 5.3 Efeitos Sonoros (Opcional)

- Som de "coin" ao ganhar pontos
- Fanfarra no level up
- "Ding" na nova badge

---

## 6. Configurações de Gamificação

### 6.1 Controle do Professor

O professor pode:
- ✅ Ativar/desativar gamificação por turma
- ✅ Ajustar pesos de pontuação
- ✅ Definir XP necessário por nível
- ✅ Ativar/desativar ranking
- ✅ Criar badges customizadas
- ✅ Definir penalidades

### 6.2 Configurações por Disciplina

```yaml
gamification:
  enabled: true
  points:
    easy: 10
    medium: 25
    hard: 50
    challenge: 100
  penalties:
    late_submission: -5 per day
    max_penalty: -20
  ranking:
    enabled: true
    allow_anonymous: true
  levels:
    max_level: 30
    curve: "progressive"
```

### 6.3 Presets

**Casual**: Foco em participação, sem penalidades
**Equilibrado**: Mix de desafio e incentivo
**Competitivo**: Rankings destacados, penalidades ativas

---

## 7. Mecânicas Avançadas

### 7.1 Multiplicadores

#### Combo System
```
Entregas consecutivas sem atraso:
- 3 entregas: 1.1x pontos
- 5 entregas: 1.2x pontos
- 10 entregas: 1.5x pontos
```

#### Power-ups Temporários
- **2x XP Weekend**: eventos especiais
- **Happy Hour**: 1.5x pontos em horário determinado
- **Bonus Week**: semana com desafios extras

### 7.2 Eventos Sazonais

- **Maratona de Código**: 1 semana intensiva
- **Desafio Relâmpago**: 24h para resolver problemas
- **Boss Fight**: desafio colaborativo da turma

### 7.3 Economia de Tokens (Futuro)

- Tokens ganhos por conquistas especiais
- Trocar por hints em exercícios
- Trocar por extensão de prazo
- Sistema justo e balanceado

---

## 8. Aspectos Pedagógicos

### 8.1 Alinhamento com Aprendizagem

**Teoria da Autodeterminação**
- Autonomia: aluno escolhe desafios extras
- Competência: progresso visível
- Relacionamento: ranking e colaboração

**Flow**
- Desafios calibrados por nível
- Feedback imediato
- Objetivos claros

### 8.2 Evitando Armadilhas

❌ **Não fazer**:
- Gamificação como único motivador
- Foco excessivo em ranking (competição tóxica)
- Pontos sem significado pedagógico

✅ **Fazer**:
- Gamificação complementa aprendizado
- Opção de privacidade
- Pontos refletem progresso real

---

## 9. Métricas e Analytics

### 9.1 Métricas do Sistema

- Taxa de engajamento antes/depois gamificação
- Pontos médios por aluno
- Distribuição de níveis
- Badges mais conquistadas

### 9.2 Dashboards

**Para o Professor**:
- Engajamento por semana
- Alunos inativos (sem pontos há X dias)
- Distribuição de ranking
- Efetividade de cada mecânica

**Para o Aluno**:
- Evolução de pontos (gráfico)
- Comparação com média da turma
- Conquistas próximas de desbloquear
- Streak atual

---

## 10. Implementação Técnica

### 10.1 Banco de Dados

```sql
-- Tabela de Pontos
CREATE TABLE points_history (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id),
  points INT NOT NULL,
  source VARCHAR(50), -- activity, mission, badge, etc
  reference_id INT, -- id da atividade/missão
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Níveis
CREATE TABLE student_levels (
  id SERIAL PRIMARY KEY,
  student_id INT UNIQUE REFERENCES users(id),
  current_level INT DEFAULT 1,
  current_xp INT DEFAULT 0,
  total_xp INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Badges
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  icon VARCHAR(50),
  rarity VARCHAR(20), -- common, uncommon, rare, epic, legendary
  criteria JSONB -- regras para desbloquear
);

-- Tabela de Conquistas do Aluno
CREATE TABLE student_badges (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id),
  badge_id INT REFERENCES badges(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, badge_id)
);

-- Tabela de Ranking
CREATE TABLE ranking (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES users(id),
  class_id INT REFERENCES classes(id),
  score INT,
  rank INT,
  period VARCHAR(20), -- weekly, monthly, semester
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 10.2 APIs Principais

```typescript
// Adicionar pontos
POST /api/gamification/points
{
  studentId: number,
  points: number,
  source: string,
  referenceId?: number
}

// Verificar level up
POST /api/gamification/check-level-up
{
  studentId: number
}

// Verificar novas badges
POST /api/gamification/check-badges
{
  studentId: number
}

// Obter ranking
GET /api/gamification/ranking?classId=1&period=weekly

// Obter progresso do aluno
GET /api/gamification/progress/:studentId
```

### 10.3 Eventos em Tempo Real

Usar WebSockets para:
- Atualização de ranking em tempo real
- Notificação de conquistas
- Animações sincronizadas

---

## 11. Considerações Éticas

### 11.1 Privacidade
- Opção de anonimização
- Não forçar participação em ranking
- Dados de gamificação não afetam nota

### 11.2 Inclusão
- Acessibilidade nas animações (opção de desativar)
- Não excluir alunos com menor tempo disponível
- Valorizar qualidade, não apenas quantidade

### 11.3 Transparência
- Regras de pontuação claras
- Critérios de badges documentados
- Sem "dark patterns"

---

## Conclusão

O módulo de gamificação é projetado para ser:
- **Motivador**: mantém alunos engajados
- **Justo**: todos podem progredir
- **Pedagógico**: reforça aprendizado real
- **Configurável**: professor tem controle
- **Ético**: respeita privacidade e inclusão

A implementação balanceada dessas mecânicas, sempre com foco no aprendizado, é o diferencial da plataforma.
