import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAchievements() {
  console.log('🌱 Criando conquistas...');

  const achievements = [
    // SUBMISSÕES
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
      name: 'Aprovado!',
      description: 'Teve sua primeira submissão aprovada',
      icon: '✅',
      category: 'SUBMISSÕES',
      points: 25,
      rarity: 'COMUM',
      condition: 'FIRST_APPROVED',
      criteria: '{"type":"approved_count","value":1}',
    },
    {
      name: 'Dez Vitórias',
      description: 'Teve 10 submissões aprovadas',
      icon: '🏆',
      category: 'SUBMISSÕES',
      points: 100,
      rarity: 'INCOMUM',
      condition: 'APPROVED_10',
      criteria: '{"type":"approved_count","value":10}',
    },
    {
      name: 'Veterano',
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
      name: 'Centurião',
      description: 'Teve 100 submissões aprovadas',
      icon: '🎖️',
      category: 'SUBMISSÕES',
      points: 1000,
      rarity: 'LENDÁRIO',
      condition: 'APPROVED_100',
      criteria: '{"type":"approved_count","value":100}',
    },
    {
      name: 'Mestre dos Códigos',
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

    // PONTOS
    {
      name: 'Primeiros Passos',
      description: 'Acumulou 100 pontos',
      icon: '🚶',
      category: 'PONTOS',
      points: 50,
      rarity: 'COMUM',
      condition: 'POINTS_100',
      criteria: '{"type":"total_points","value":100}',
    },
    {
      name: 'Em Progresso',
      description: 'Acumulou 500 pontos',
      icon: '🏃',
      category: 'PONTOS',
      points: 100,
      rarity: 'INCOMUM',
      condition: 'POINTS_500',
      criteria: '{"type":"total_points","value":500}',
    },
    {
      name: 'Dedicado',
      description: 'Acumulou 1000 pontos',
      icon: '💪',
      category: 'PONTOS',
      points: 250,
      rarity: 'RARO',
      condition: 'POINTS_1000',
      criteria: '{"type":"total_points","value":1000}',
    },
    {
      name: 'Expert em Pontos',
      description: 'Acumulou 5000 pontos',
      icon: '🌟',
      category: 'PONTOS',
      points: 500,
      rarity: 'ÉPICO',
      condition: 'POINTS_5000',
      criteria: '{"type":"total_points","value":5000}',
    },
    {
      name: 'Mestre dos Pontos',
      description: 'Acumulou 10000 pontos',
      icon: '💎',
      category: 'PONTOS',
      points: 1000,
      rarity: 'LENDÁRIO',
      condition: 'POINTS_10000',
      criteria: '{"type":"total_points","value":10000}',
    },

    // NÍVEIS
    {
      name: 'Aprendiz',
      description: 'Alcançou o nível 1',
      icon: '📚',
      category: 'NÍVEIS',
      points: 20,
      rarity: 'COMUM',
      condition: 'LEVEL_1',
      criteria: '{"type":"level","value":1}',
    },
    {
      name: 'Junior',
      description: 'Alcançou o nível 3',
      icon: '💻',
      category: 'NÍVEIS',
      points: 50,
      rarity: 'INCOMUM',
      condition: 'LEVEL_3',
      criteria: '{"type":"level","value":3}',
    },
    {
      name: 'Pleno',
      description: 'Alcançou o nível 5',
      icon: '⚡',
      category: 'NÍVEIS',
      points: 100,
      rarity: 'RARO',
      condition: 'LEVEL_5',
      criteria: '{"type":"level","value":5}',
    },
    {
      name: 'Sênior',
      description: 'Alcançou o nível 7',
      icon: '🎯',
      category: 'NÍVEIS',
      points: 200,
      rarity: 'ÉPICO',
      condition: 'LEVEL_7',
      criteria: '{"type":"level","value":7}',
    },
    {
      name: 'Arquiteto',
      description: 'Alcançou o nível 10',
      icon: '🏛️',
      category: 'NÍVEIS',
      points: 500,
      rarity: 'LENDÁRIO',
      condition: 'LEVEL_10',
      criteria: '{"type":"level","value":10}',
    },

    // PERFEIÇÃO
    {
      name: 'Perfeccionista',
      description: 'Teve 10 submissões com 100% de acerto',
      icon: '💯',
      category: 'ESPECIAL',
      points: 300,
      rarity: 'RARO',
      condition: 'PERFECTIONIST_10',
      criteria: '{"type":"perfect_count","value":10}',
    },
    {
      name: 'Código Limpo',
      description: 'Teve 25 submissões com 100% de acerto',
      icon: '✨',
      category: 'ESPECIAL',
      points: 750,
      rarity: 'ÉPICO',
      condition: 'PERFECTIONIST_25',
      criteria: '{"type":"perfect_count","value":25}',
    },
    {
      name: 'Mestre da Perfeição',
      description: 'Teve 50 submissões com 100% de acerto',
      icon: '🌟',
      category: 'ESPECIAL',
      points: 1500,
      rarity: 'LENDÁRIO',
      condition: 'PERFECTIONIST_50',
      criteria: '{"type":"perfect_count","value":50}',
    },

    // VELOCIDADE
    {
      name: 'Rápido e Furioso',
      description: 'Completou uma atividade em menos de 1 minuto',
      icon: '⚡',
      category: 'TEMPO',
      points: 50,
      rarity: 'INCOMUM',
      condition: 'FAST_1MIN',
      criteria: '{"type":"fast_submission","value":60}',
    },
    {
      name: 'Speed Runner',
      description: 'Completou 10 atividades em menos de 2 minutos cada',
      icon: '🏎️',
      category: 'TEMPO',
      points: 200,
      rarity: 'RARO',
      condition: 'SPEED_10',
      criteria: '{"type":"fast_submissions","count":10,"max_time":120}',
    },

    // SEQUÊNCIA
    {
      name: 'Sequência de 3',
      description: 'Teve 3 submissões aprovadas consecutivas',
      icon: '🔥',
      category: 'SEQUÊNCIA',
      points: 75,
      rarity: 'INCOMUM',
      condition: 'STREAK_3',
      criteria: '{"type":"streak","value":3}',
    },
    {
      name: 'Sequência de 5',
      description: 'Teve 5 submissões aprovadas consecutivas',
      icon: '🔥🔥',
      category: 'SEQUÊNCIA',
      points: 150,
      rarity: 'RARO',
      condition: 'STREAK_5',
      criteria: '{"type":"streak","value":5}',
    },
    {
      name: 'Imparável',
      description: 'Teve 10 submissões aprovadas consecutivas',
      icon: '🔥🔥🔥',
      category: 'SEQUÊNCIA',
      points: 500,
      rarity: 'ÉPICO',
      condition: 'STREAK_10',
      criteria: '{"type":"streak","value":10}',
    },

    // LINGUAGENS
    {
      name: 'Poliglota',
      description: 'Teve submissões aprovadas em 3 linguagens diferentes',
      icon: '🌍',
      category: 'ESPECIAL',
      points: 100,
      rarity: 'RARO',
      condition: 'MULTILANG_3',
      criteria: '{"type":"languages","value":3}',
    },
    {
      name: 'Mestre das Linguagens',
      description: 'Teve submissões aprovadas em 5 linguagens diferentes',
      icon: '🗣️',
      category: 'ESPECIAL',
      points: 300,
      rarity: 'ÉPICO',
      condition: 'MULTILANG_5',
      criteria: '{"type":"languages","value":5}',
    },

    // SOCIAL
    {
      name: 'Primeira Posição',
      description: 'Ficou em primeiro lugar no ranking da turma',
      icon: '🥇',
      category: 'SOCIAL',
      points: 200,
      rarity: 'RARO',
      condition: 'RANK_1',
      criteria: '{"type":"ranking","scope":"class","position":1}',
    },
    {
      name: 'Campeão Global',
      description: 'Ficou em primeiro lugar no ranking global',
      icon: '👑',
      category: 'SOCIAL',
      points: 1000,
      rarity: 'LENDÁRIO',
      condition: 'RANK_GLOBAL_1',
      criteria: '{"type":"ranking","scope":"global","position":1}',
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { condition: achievement.condition },
      update: achievement,
      create: achievement,
    });
  }

  const count = await prisma.achievement.count();
  console.log(`✅ ${count} conquistas criadas/atualizadas!`);
}

seedAchievements()
  .catch((e) => {
    console.error('❌ Erro ao criar conquistas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
