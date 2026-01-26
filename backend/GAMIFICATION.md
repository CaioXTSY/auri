# 🎮 Sistema de Gamificação

Sistema completo de gamificação implementado com pontos, níveis, conquistas e rankings.

## 📋 Índice

- [Instalação](#instalação)
- [Sistema de Pontos](#sistema-de-pontos)
- [Sistema de Níveis](#sistema-de-níveis)
- [Sistema de Conquistas](#sistema-de-conquistas)
- [Sistema de Rankings](#sistema-de-rankings)
- [API Endpoints](#api-endpoints)
- [Integração Automática](#integração-automática)

## 🚀 Instalação

### 1. Criar as Conquistas Iniciais

```powershell
cd backend
npm run ts-node prisma/seed-achievements.ts
```

Isso criará **31 conquistas** em 8 categorias:
- 🎯 Submissões (8 conquistas)
- 💰 Pontos (5 conquistas)
- 📊 Níveis (5 conquistas)
- ✨ Perfeição (3 conquistas)
- ⚡ Velocidade (2 conquistas)
- 🔥 Sequência (3 conquistas)
- 🌍 Linguagens (2 conquistas)
- 👥 Social (3 conquistas)

### 2. Atualizar Rankings (Primeira vez)

```bash
# Ranking Global
POST http://localhost:3000/gamification/ranking/update/global

# Ranking de Disciplina
POST http://localhost:3000/gamification/ranking/update/discipline/:disciplineId

# Ranking de Turma
POST http://localhost:3000/gamification/ranking/update/class/:classId
```

## 💰 Sistema de Pontos

### Como Funciona

- **Automático**: Pontos são adicionados automaticamente quando aluno completa atividades
- **Manual**: Admin/Professor podem adicionar pontos manualmente
- **Histórico**: Todo ganho de pontos é registrado com fonte e descrição

### Fontes de Pontos

1. **ATIVIDADE**: Completar atividades (proporcional ao desempenho)
2. **CONQUISTA**: Desbloquear conquistas
3. **BONUS_PROFESSOR**: Professor adiciona manualmente
4. **MISSAO**: Completar missões (futuro)

### Endpoints

```typescript
// Meus pontos totais
GET /gamification/points/me
Response: { userId: string, totalPoints: number }

// Histórico de pontos
GET /gamification/points/history?limit=50
Response: Array<{
  id: string
  userId: string
  points: number
  source: string
  description: string
  referenceId?: string
  createdAt: Date
}>

// Adicionar pontos (Admin/Professor apenas)
POST /gamification/points/add
Body: {
  userId: string
  points: number
  source: string
  description: string
  referenceId?: string
}
```

## 📊 Sistema de Níveis

### Fórmula de Cálculo

```
level = floor(sqrt(totalPoints / 100))
```

Exemplos:
- 100 pontos = Nível 1
- 400 pontos = Nível 2
- 900 pontos = Nível 3
- 2500 pontos = Nível 5
- 10000 pontos = Nível 10

### Nomes dos Níveis

| Nível | Nome |
|-------|------|
| 0 | Iniciante |
| 1 | Aprendiz |
| 2 | Programador Junior |
| 3 | Desenvolvedor |
| 4 | Programador Pleno |
| 5 | Desenvolvedor Sênior |
| 6 | Arquiteto |
| 7 | Tech Lead |
| 8 | Especialista |
| 9 | Mestre |
| 10+ | Grande Mestre / Lenda |

### Endpoints

```typescript
// Meu nível atual
GET /gamification/level/me
Response: {
  userId: string
  totalPoints: number
  currentLevel: number
  levelName: string
  pointsInCurrentLevel: number
  pointsNeededForNextLevel: number
  progressToNextLevel: number // 0-100
}

// Nível de outro usuário (Professor/Admin)
GET /gamification/level/:userId
```

## 🏆 Sistema de Conquistas

### Categorias

1. **SUBMISSÕES** - Baseadas em quantidade de submissões aprovadas
2. **PONTOS** - Baseadas em pontos totais acumulados
3. **NÍVEIS** - Desbloqueadas ao alcançar níveis específicos
4. **ESPECIAL** - Perfeição, linguagens, etc
5. **TEMPO** - Velocidade de resolução
6. **SEQUÊNCIA** - Streak de aprovações consecutivas
7. **SOCIAL** - Rankings e competição

### Raridades

| Raridade | Descrição |
|----------|-----------|
| COMUM | Fácil de conseguir, baixos pontos |
| INCOMUM | Requer algum esforço |
| RARO | Difícil de conseguir |
| ÉPICO | Muito difícil |
| LENDÁRIO | Extremamente raro |

### Desbloqueio Automático

As seguintes conquistas são desbloqueadas automaticamente:

- **Primeira submissão aprovada** → "Aprovado!" (25 pts)
- **10, 25, 50, 100, 250, 500 aprovadas** → Conquistas progressivas
- **100, 500, 1000, 5000, 10000 pontos** → Conquistas de pontos
- **Níveis 1, 3, 5, 7, 10** → Conquistas de nível
- **10 submissões perfeitas (100%)** → "Perfeccionista" (300 pts)

### Endpoints

```typescript
// Listar todas as conquistas disponíveis
GET /gamification/achievements
Response: Array<Achievement>

// Minhas conquistas
GET /gamification/achievements/me
Response: {
  unlocked: Array<Achievement & { unlockedAt: Date }>
  locked: Array<Achievement & { unlockedAt: null }>
  total: number
  unlockedCount: number
  progress: number // 0-100
}

// Criar conquista (Admin apenas)
POST /gamification/achievements
Body: {
  name: string
  description: string
  icon?: string
  category: string
  points: number
  rarity?: 'COMUM' | 'INCOMUM' | 'RARO' | 'ÉPICO' | 'LENDÁRIO'
  condition: string
}

// Desbloquear manualmente (Admin apenas)
POST /gamification/achievements/:achievementId/unlock/:userId
```

## 📈 Sistema de Rankings

### Tipos de Ranking

1. **GLOBAL** - Todos os usuários da plataforma
2. **DISCIPLINA** - Por disciplina específica
3. **TURMA** - Por turma específica

### Atualização

Rankings devem ser atualizados periodicamente (cron job recomendado):

```typescript
// Atualizar ranking global (Admin)
POST /gamification/ranking/update/global

// Atualizar ranking de disciplina (Professor/Admin)
POST /gamification/ranking/update/discipline/:disciplineId

// Atualizar ranking de turma (Professor/Admin)
POST /gamification/ranking/update/class/:classId
```

### Endpoints

```typescript
// Obter ranking
GET /gamification/ranking?type=GLOBAL&referenceId=&limit=50
Parameters:
  - type: 'GLOBAL' | 'DISCIPLINA' | 'TURMA'
  - referenceId?: string (obrigatório para DISCIPLINA e TURMA)
  - limit?: number (padrão: 50, máx: 100)

Response: Array<{
  position: number
  points: number
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}>

// Minha posição no ranking
GET /gamification/ranking/me?type=GLOBAL&referenceId=
Response: {
  position: number
  points: number
  user: User
} | null
```

## 📊 Dashboard de Gamificação

### Endpoint Completo

```typescript
// Minhas estatísticas completas
GET /gamification/stats/me
Response: {
  points: {
    total: number
  }
  level: {
    userId: string
    totalPoints: number
    currentLevel: number
    levelName: string
    pointsInCurrentLevel: number
    pointsNeededForNextLevel: number
    progressToNextLevel: number
  }
  achievements: {
    unlocked: number
    total: number
    progress: number
  }
  ranking: {
    global: number | null
    points: number
  }
}

// Estatísticas de outro usuário (Professor/Admin)
GET /gamification/stats/:userId
```

## 🔄 Integração Automática

### Submissões

O sistema está **automaticamente integrado** com o módulo de Submissões:

```typescript
// Quando uma submissão é executada e aprovada:
1. Pontos são adicionados automaticamente
2. Conquistas são verificadas e desbloqueadas
3. Rankings são mantidos (atualizar manualmente para performance)
```

### Fluxo Automático

```
Aluno submete código
    ↓
Judge0 executa testes
    ↓
SubmissionsService.execute()
    ↓
Pontos adicionados (se passou testes)
    ↓
GamificationService.addPoints()
    ↓
Verificar nível (level up?)
    ↓
Verificar conquistas de pontos
    ↓
checkSubmissionAchievements()
    ↓
Verificar conquistas de submissões
```

### Conquistas Verificadas Automaticamente

- ✅ Primeira submissão aprovada
- ✅ 10, 25, 50, 100, 250, 500 submissões aprovadas
- ✅ Marcos de pontos (100, 500, 1000, 5000, 10000)
- ✅ Níveis alcançados (1, 3, 5, 7, 10)
- ✅ 10 submissões perfeitas (100%)

### Conquistas Manuais (TODO)

Estas precisam ser implementadas:
- ⏳ Velocidade (tempo de execução)
- ⏳ Sequência (streak consecutivo)
- ⏳ Linguagens múltiplas
- ⏳ Rankings (1º lugar)

## 🔐 Permissões

| Endpoint | ALUNO | PROFESSOR | ADMIN |
|----------|-------|-----------|-------|
| GET /points/me | ✅ | ✅ | ✅ |
| GET /points/history | ✅ | ✅ | ✅ |
| POST /points/add | ❌ | ✅ | ✅ |
| GET /level/me | ✅ | ✅ | ✅ |
| GET /level/:userId | ❌ | ✅ | ✅ |
| GET /achievements | ✅ | ✅ | ✅ |
| GET /achievements/me | ✅ | ✅ | ✅ |
| POST /achievements | ❌ | ❌ | ✅ |
| POST /achievements/unlock | ❌ | ❌ | ✅ |
| GET /ranking | ✅ | ✅ | ✅ |
| GET /ranking/me | ✅ | ✅ | ✅ |
| POST /ranking/update/* | ❌ | ✅ | ✅ |
| GET /stats/me | ✅ | ✅ | ✅ |
| GET /stats/:userId | ❌ | ✅ | ✅ |

## 🎯 Casos de Uso

### 1. Aluno Completa Atividade

```
Aluno resolve atividade → Ganha 80 pontos (80% acerto)
    ↓
Sistema adiciona pontos automaticamente
    ↓
Verifica se subiu de nível
    ↓
Verifica conquistas desbloqueadas
    ↓
Notifica aluno (futuro)
```

### 2. Professor Dá Bônus

```typescript
POST /gamification/points/add
Body: {
  userId: "uuid-aluno",
  points: 50,
  source: "BONUS_PROFESSOR",
  description: "Excelente participação em aula"
}
```

### 3. Consultar Progresso

```typescript
GET /gamification/stats/me
// Retorna tudo: pontos, nível, conquistas, ranking
```

### 4. Ver Ranking da Turma

```typescript
GET /gamification/ranking?type=TURMA&referenceId=uuid-turma&limit=20
// Top 20 alunos da turma
```

## 🔧 Manutenção

### Atualizar Rankings (Recomendado: Cron Job)

```typescript
// A cada hora ou diariamente
POST /gamification/ranking/update/global

// Quando necessário
POST /gamification/ranking/update/discipline/:id
POST /gamification/ranking/update/class/:id
```

### Adicionar Nova Conquista

```typescript
POST /gamification/achievements
Body: {
  name: "Nova Conquista",
  description: "Descrição da conquista",
  icon: "🎯",
  category: "ESPECIAL",
  points: 100,
  rarity: "RARO",
  condition: "UNIQUE_CONDITION_ID"
}
```

### Desbloquear Conquista Manualmente

```typescript
POST /gamification/achievements/:achievementId/unlock/:userId
```

## 📝 TODO / Melhorias Futuras

- [ ] Implementar conquistas de velocidade
- [ ] Implementar conquistas de sequência (streak)
- [ ] Implementar conquistas de múltiplas linguagens
- [ ] Implementar conquistas de ranking
- [ ] Sistema de notificações para conquistas desbloqueadas
- [ ] Websockets para atualização em tempo real
- [ ] Dashboard visual com gráficos
- [ ] Sistema de badges personalizados por professor
- [ ] Tabela de líderes pública
- [ ] Histórico de evolução do usuário

## 🎨 Frontend (Sugestões)

### Componentes Recomendados

1. **PointsBadge** - Mostra pontos totais do usuário
2. **LevelBar** - Barra de progresso para próximo nível
3. **AchievementCard** - Card de conquista (locked/unlocked)
4. **LeaderboardTable** - Tabela de ranking
5. **GamificationDashboard** - Dashboard completo com stats

### Exemplo de Uso

```tsx
// Dashboard do aluno
const { data } = useQuery('/gamification/stats/me')

<div>
  <PointsBadge points={data.points.total} />
  <LevelBar 
    level={data.level.currentLevel} 
    progress={data.level.progressToNextLevel} 
  />
  <AchievementsList 
    unlocked={data.achievements.unlocked}
    total={data.achievements.total}
  />
</div>
```

## 🐛 Troubleshooting

### Rankings não atualizam

Execute manualmente:
```bash
POST /gamification/ranking/update/global
```

### Conquistas não desbloqueiam

Verifique:
1. Seed das conquistas foi executado? `npm run ts-node prisma/seed-achievements.ts`
2. Condição está correta no banco?
3. Logs do backend para erros

### Pontos não aparecem

Verifique:
1. Submissão foi aprovada? (status = APROVADO)
2. Ganhou pontos? (pointsEarned > 0)
3. Logs do GamificationService

## 📚 Referências

- Prisma Schema: `backend/prisma/schema.prisma`
- Service: `backend/src/modules/gamification/gamification.service.ts`
- Controller: `backend/src/modules/gamification/gamification.controller.ts`
- Seed: `backend/prisma/seed-achievements.ts`
