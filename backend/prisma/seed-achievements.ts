import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAchievements() {
  console.log('🌱 Criando conquistas...');

  const achievements = [
    // SUBMISSÕES (8)
    {
      name: 'Primeira Submissão',
      description: 'Enviou sua primeira atividade',
      icon: '🎯',
      category: 'SUBMISSÕES',
      points: 10,
      rarity: 'COMUM',
      condition: 'FIRST_SUBMISSION',
      criteria: '{"type":"submission_count","value":1}',
    },
    {
      name: 'Na Mosca!',
      description: 'Teve sua primeira submissão aprovada',
      icon: '✅',
      category: 'SUBMISSÕES',
      points: 25,
      rarity: 'COMUM',
      condition: 'FIRST_APPROVED',
      criteria: '{"type":"approved_count","value":1}',
    },
    {
      name: 'Praticante',
      description: 'Teve 10 submissões aprovadas',
      icon: '🏆',
      category: 'SUBMISSÕES',
      points: 100,
      rarity: 'INCOMUM',
      condition: 'APPROVED_10',
      criteria: '{"type":"approved_count","value":10}',
    },
    {
      name: 'Experiente',
      description: 'Teve 25 submissões aprovadas',
      icon: '⭐',
      category: 'SUBMISSÕES',
      points: 250,
      rarity: 'RARO',
      condition: 'APPROVED_25',
      criteria: '{"type":"approved_count","value":25}',
    },
    {
      name: 'Expert',
      description: 'Teve 50 submissões aprovadas',
      icon: '💫',
      category: 'SUBMISSÕES',
      points: 500,
      rarity: 'ÉPICO',
      condition: 'APPROVED_50',
      criteria: '{"type":"approved_count","value":50}',
    },
    {
      name: 'Mestre do Código',
      description: 'Teve 100 submissões aprovadas',
      icon: '🎖️',
      category: 'SUBMISSÕES',
      points: 1000,
      rarity: 'LENDÁRIO',
      condition: 'APPROVED_100',
      criteria: '{"type":"approved_count","value":100}',
    },
    {
      name: 'Grande Mestre',
      description: 'Teve 250 submissões aprovadas',
      icon: '👑',
      category: 'SUBMISSÕES',
      points: 2500,
      rarity: 'LENDÁRIO',
      condition: 'APPROVED_250',
      criteria: '{"type":"approved_count","value":250}',
    },
    {
      name: 'Lenda Viva',
      description: 'Teve 500 submissões aprovadas',
      icon: '🔥',
      category: 'SUBMISSÕES',
      points: 5000,
      rarity: 'LENDÁRIO',
      condition: 'APPROVED_500',
      criteria: '{"type":"approved_count","value":500}',
    },

    // PONTOS (5)
    {
      name: 'Centenário',
      description: 'Acumulou 100 pontos',
      icon: '💯',
      category: 'PONTOS',
      points: 50,
      rarity: 'COMUM',
      condition: 'POINTS_100',
      criteria: '{"type":"total_points","value":100}',
    },
    {
      name: 'Milionário (de pontos)',
      description: 'Acumulou 1.000 pontos',
      icon: '💰',
      category: 'PONTOS',
      points: 200,
      rarity: 'RARO',
      condition: 'POINTS_1000',
      criteria: '{"type":"total_points","value":1000}',
    },
    {
      name: 'Magnata',
      description: 'Acumulou 5.000 pontos',
      icon: '🏦',
      category: 'PONTOS',
      points: 1000,
      rarity: 'ÉPICO',
      condition: 'POINTS_5000',
      criteria: '{"type":"total_points","value":5000}',
    },
    {
      name: 'Subindo na Vida',
      description: 'Alcançou o Nível 5',
      icon: '📈',
      category: 'NÍVEIS',
      points: 100,
      rarity: 'INCOMUM',
      condition: 'LEVEL_5',
      criteria: '{"type":"level","value":5}',
    },
    {
      name: 'No Topo',
      description: 'Alcançou o Nível 10',
      icon: '🏔️',
      category: 'NÍVEIS',
      points: 500,
      rarity: 'ÉPICO',
      condition: 'LEVEL_10',
      criteria: '{"type":"level","value":10}',
    },

    // INTERAÇÃO E MISSÕES (3)
    {
      name: 'Bem-vindo a bordo!',
      description: 'Realizou o primeiro login',
      icon: '👋',
      category: 'ESPECIAL',
      points: 10,
      rarity: 'COMUM',
      condition: 'FIRST_LOGIN',
      criteria: '{"type":"login","value":1}',
    },
    {
      name: 'Enturmado',
      description: 'Entrou na primeira turma',
      icon: '🏫',
      category: 'ESPECIAL',
      points: 20,
      rarity: 'COMUM',
      condition: 'FIRST_CLASS_JOIN',
      criteria: '{"type":"class_join","value":1}',
    },
    {
      name: 'Missão Cumprida',
      description: 'Completou sua primeira missão',
      icon: '📜',
      category: 'MISSÕES',
      points: 30,
      rarity: 'COMUM',
      condition: 'FIRST_MISSION_COMPLETED',
      criteria: '{"type":"mission_completed","value":1}',
    },

    // DESEMPENHO E HÁBITOS (4)
    {
      name: 'Perfeccionista',
      description: 'Obteve pontuação máxima em uma atividade',
      icon: '✨',
      category: 'ESPECIAL',
      points: 50,
      rarity: 'INCOMUM',
      condition: 'PERFECT_SUBMISSION',
      criteria: '{"type":"perfect_score","value":1}',
    },
    {
      name: 'Corujão',
      description: 'Enviou código na madrugada (00h-04h)',
      icon: '🦉',
      category: 'ESPECIAL',
      points: 30,
      rarity: 'INCOMUM',
      condition: 'NIGHT_OWL',
      criteria: '{"type":"time_window","start":0,"end":4}',
    },
    {
      name: 'Madrugador',
      description: 'Enviou código logo cedo (05h-08h)',
      icon: '🌅',
      category: 'ESPECIAL',
      points: 30,
      rarity: 'INCOMUM',
      condition: 'EARLY_BIRD',
      criteria: '{"type":"time_window","start":5,"end":8}',
    },
    {
      name: 'Guerreiro do Fim de Semana',
      description: 'Estudou no sábado ou domingo',
      icon: '⚔️',
      category: 'ESPECIAL',
      points: 40,
      rarity: 'INCOMUM',
      condition: 'WEEKEND_WARRIOR',
      criteria: '{"type":"days","value":[0,6]}',
    },
    {
      name: 'Poliglota',
      description: 'Enviou soluções em 2 linguagens diferentes',
      icon: '🗣️',
      category: 'ESPECIAL',
      points: 100,
      rarity: 'RARO',
      condition: 'POLYGLOT',
      criteria: '{"type":"languages_count","value":2}',
    },
    // SEQUÊNCIA DIÁRIA (5)
    {
      name: 'Primeiros Passos',
      description: 'Respondeu corretamente o quiz diário por 3 dias consecutivos',
      icon: '🔥',
      category: 'SEQUÊNCIA',
      points: 30,
      rarity: 'COMUM',
      condition: 'STREAK_3',
      criteria: '{"type":"streak","value":3}',
    },
    {
      name: 'Semana de Fogo',
      description: 'Manteve uma sequência de 7 dias no quiz diário',
      icon: '🔥',
      category: 'SEQUÊNCIA',
      points: 75,
      rarity: 'INCOMUM',
      condition: 'STREAK_7',
      criteria: '{"type":"streak","value":7}',
    },
    {
      name: 'Duas Semanas Imparável',
      description: 'Manteve uma sequência de 14 dias no quiz diário',
      icon: '💥',
      category: 'SEQUÊNCIA',
      points: 150,
      rarity: 'RARO',
      condition: 'STREAK_14',
      criteria: '{"type":"streak","value":14}',
    },
    {
      name: 'Mês de Dedicação',
      description: 'Manteve uma sequência de 30 dias no quiz diário',
      icon: '⚡',
      category: 'SEQUÊNCIA',
      points: 300,
      rarity: 'ÉPICO',
      condition: 'STREAK_30',
      criteria: '{"type":"streak","value":30}',
    },
    {
      name: 'Centenário',
      description: 'Manteve uma sequência impressionante de 100 dias no quiz diário',
      icon: '👑',
      category: 'SEQUÊNCIA',
      points: 750,
      rarity: 'LENDÁRIO',
      condition: 'STREAK_100',
      criteria: '{"type":"streak","value":100}',
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { condition: achievement.condition },
      update: achievement,
      create: achievement,
    });
  }

  console.log('✅ Conquistas criadas/atualizadas com sucesso!');
}

seedAchievements()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
