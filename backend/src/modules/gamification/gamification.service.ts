import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Serviço de Gamificação
 * Gerencia pontos, níveis, conquistas e rankings
 */
@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * SISTEMA DE PONTOS
   */

  /**
   * Adicionar pontos para um usuário
   */
  async addPoints(
    userId: string,
    points: number,
    source: string,
    description: string,
    referenceId?: string,
  ) {
    this.logger.log(
      `Adicionando ${points} pontos para usuário ${userId} - ${source}`,
    );

    // Criar registro de pontos
    const userPoint = await this.prisma.userPoint.create({
      data: {
        userId,
        points,
        source,
        description,
        referenceId,
      },
    });

    // Verificar se desbloqueou novo nível
    await this.checkLevelUp(userId);

    // Verificar conquistas baseadas em pontos
    await this.checkPointsAchievements(userId);

    return userPoint;
  }

  /**
   * Obter pontos totais de um usuário
   */
  async getUserTotalPoints(userId: string): Promise<number> {
    const result = await this.prisma.userPoint.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    return result._sum.points || 0;
  }

  /**
   * Obter histórico de pontos
   */
  async getUserPointsHistory(userId: string, limit = 50) {
    return this.prisma.userPoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * SISTEMA DE NÍVEIS
   */

  /**
   * Calcular nível baseado em pontos totais
   * Fórmula: level = floor(sqrt(points / 100))
   */
  calculateLevel(totalPoints: number): number {
    return Math.floor(Math.sqrt(totalPoints / 100));
  }

  /**
   * Calcular pontos necessários para próximo nível
   */
  calculatePointsForNextLevel(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    return Math.pow(nextLevel, 2) * 100;
  }

  /**
   * Obter informações de nível do usuário
   */
  async getUserLevel(userId: string) {
    const totalPoints = await this.getUserTotalPoints(userId);
    const currentLevel = this.calculateLevel(totalPoints);
    const pointsForNextLevel = this.calculatePointsForNextLevel(currentLevel);
    const currentLevelPoints = Math.pow(currentLevel, 2) * 100;
    const pointsInCurrentLevel = totalPoints - currentLevelPoints;
    const pointsNeededForNextLevel = pointsForNextLevel - totalPoints;

    return {
      userId,
      totalPoints,
      currentLevel,
      levelName: this.getLevelName(currentLevel),
      pointsInCurrentLevel,
      pointsNeededForNextLevel,
      progressToNextLevel:
        (pointsInCurrentLevel / (pointsForNextLevel - currentLevelPoints)) *
        100,
    };
  }

  /**
   * Nome dos níveis
   */
  private getLevelName(level: number): string {
    const names = [
      'Iniciante',
      'Aprendiz',
      'Programador Junior',
      'Desenvolvedor',
      'Programador Pleno',
      'Desenvolvedor Sênior',
      'Arquiteto',
      'Tech Lead',
      'Especialista',
      'Mestre',
      'Grande Mestre',
      'Lenda',
    ];

    if (level < names.length) {
      return `${names[level]} (Nível ${level})`;
    }

    return `Lenda Nível ${level}`;
  }

  /**
   * Verificar se usuário subiu de nível
   */
  private async checkLevelUp(userId: string) {
    const levelInfo = await this.getUserLevel(userId);

    // Poderia criar uma notificação aqui
    if (levelInfo.pointsInCurrentLevel < 100) {
      // Acabou de subir de nível
      this.logger.log(
        `🎉 Usuário ${userId} subiu para ${levelInfo.levelName}!`,
      );

      // Desbloquear conquista de nível
      await this.checkLevelAchievements(userId, levelInfo.currentLevel);
    }
  }

  /**
   * SISTEMA DE CONQUISTAS
   */

  /**
   * Criar uma conquista
   */
  async createAchievement(data: {
    name: string;
    description: string;
    icon?: string;
    category: string;
    points: number;
    rarity?: string;
    condition: string;
    criteria?: string;
  }) {
    return this.prisma.achievement.create({
      data: {
        ...data,
        rarity: data.rarity || 'COMUM',
        criteria: data.criteria || '{}',
      },
    });
  }

  /**
   * Listar todas as conquistas
   */
  async getAllAchievements() {
    return this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { points: 'desc' }],
    });
  }

  /**
   * Desbloquear conquista para usuário
   */
  async unlockAchievement(userId: string, achievementId: string) {
    // Verificar se já tem
    const existing = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Desbloquear
    const userAchievement = await this.prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
        unlockedAt: new Date(),
      },
      include: {
        achievement: true,
      },
    });

    // Adicionar pontos da conquista
    await this.addPoints(
      userId,
      userAchievement.achievement.points,
      'CONQUISTA',
      `Desbloqueou: ${userAchievement.achievement.name}`,
      achievementId,
    );

    this.logger.log(
      `🏆 Usuário ${userId} desbloqueou: ${userAchievement.achievement.name}`,
    );

    return userAchievement;
  }

  /**
   * Obter conquistas do usuário
   */
  async getUserAchievements(userId: string) {
    const unlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });

    const all = await this.getAllAchievements();

    const unlockedIds = new Set(unlocked.map((ua) => ua.achievementId));

    return {
      unlocked: unlocked.map((ua) => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
      })),
      locked: all
        .filter((a) => !unlockedIds.has(a.id))
        .map((a) => ({
          ...a,
          unlockedAt: null,
        })),
      total: all.length,
      unlockedCount: unlocked.length,
      progress: (unlocked.length / all.length) * 100,
    };
  }

  /**
   * Verificar conquistas de login
   */
  async checkLoginAchievements(userId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { condition: 'FIRST_LOGIN' },
    });

    if (achievement) {
      await this.unlockAchievement(userId, achievement.id);
    }
  }

  /**
   * Verificar conquistas de entrada em turma
   */
  async checkClassJoinAchievements(userId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { condition: 'FIRST_CLASS_JOIN' },
    });

    if (achievement) {
      await this.unlockAchievement(userId, achievement.id);
    }
  }

  /**
   * Verificar conquistas de missão
   */
  async checkMissionAchievements(userId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { condition: 'FIRST_MISSION_COMPLETED' },
    });

    if (achievement) {
      await this.unlockAchievement(userId, achievement.id);
    }
  }

  /**
   * Verificar conquistas detalhadas de submissão (tempo, performance, linguagens)
   */
  async checkSubmissionDetailAchievements(userId: string, submission: any) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Domingo, 6 = Sábado

    // 1. NIGHT_OWL (00h - 04h)
    if (hour >= 0 && hour <= 4) {
      const achievement = await this.prisma.achievement.findUnique({
        where: { condition: 'NIGHT_OWL' },
      });
      if (achievement) await this.unlockAchievement(userId, achievement.id);
    }

    // 2. EARLY_BIRD (05h - 08h)
    if (hour >= 5 && hour <= 8) {
      const achievement = await this.prisma.achievement.findUnique({
        where: { condition: 'EARLY_BIRD' },
      });
      if (achievement) await this.unlockAchievement(userId, achievement.id);
    }

    // 3. WEEKEND_WARRIOR (Sábado ou Domingo)
    if (day === 0 || day === 6) {
      const achievement = await this.prisma.achievement.findUnique({
        where: { condition: 'WEEKEND_WARRIOR' },
      });
      if (achievement) await this.unlockAchievement(userId, achievement.id);
    }

    // 4. PERFECT_SUBMISSION (Pontuação total da atividade)
    if (submission.activity && submission.pointsEarned === submission.activity.points) {
      const achievement = await this.prisma.achievement.findUnique({
        where: { condition: 'PERFECT_SUBMISSION' },
      });
      if (achievement) await this.unlockAchievement(userId, achievement.id);
    }

    // 5. POLYGLOT (2 linguagens diferentes)
    const distinctLanguages = await this.prisma.submission.groupBy({
      by: ['language'],
      where: {
        userId,
        status: 'APROVADO',
      },
    });

    if (distinctLanguages.length >= 2) {
      const achievement = await this.prisma.achievement.findUnique({
        where: { condition: 'POLYGLOT' },
      });
      if (achievement) await this.unlockAchievement(userId, achievement.id);
    }

    // 6. FIRST_APPROVED (Primeira submissão aprovada)
    // Contar submissões aprovadas do usuário
    const approvedCount = await this.prisma.submission.count({
      where: {
        userId,
        status: 'APROVADO',
      },
    });

    if (approvedCount === 1 && submission.status === 'APROVADO') {
      const achievement = await this.prisma.achievement.findUnique({
        where: { condition: 'FIRST_APPROVED' },
      });
      if (achievement) await this.unlockAchievement(userId, achievement.id);
    }

    // 7. APPROVED_X (Marcos de submissões aprovadas)
    const milestones = [10, 25, 50, 100, 250, 500];
    if (milestones.includes(approvedCount) && submission.status === 'APROVADO') {
      const achievement = await this.prisma.achievement.findFirst({
        where: { condition: `APPROVED_${approvedCount}` },
      });
      if (achievement) {
        await this.unlockAchievement(userId, achievement.id);
      }
    }

    // 8. PERFECTIONIST_10 (10 submissões perfeitas)
    if (submission.status === 'APROVADO') {
      const perfectCount = await this.prisma.submission.count({
        where: {
          userId,
          status: 'APROVADO',
          pointsEarned: {
            gte: 100, // Assumindo que 100% = pontos máximos da atividade
          },
        },
      });

      if (perfectCount === 10) {
        const achievement = await this.prisma.achievement.findUnique({
          where: { condition: 'PERFECTIONIST_10' },
        });
        if (achievement) {
          await this.unlockAchievement(userId, achievement.id);
        }
      }
    }
  }

  /**
   * Verificar conquistas baseadas em pontos
   */
  private async checkPointsAchievements(userId: string) {
    const totalPoints = await this.getUserTotalPoints(userId);

    // Conquistas de marcos de pontos
    const pointMilestones = [
      { points: 100, name: 'Primeiros Passos' },
      { points: 500, name: 'Em Progresso' },
      { points: 1000, name: 'Dedicado' },
      { points: 5000, name: 'Expert' },
      { points: 10000, name: 'Mestre' },
    ];

    for (const milestone of pointMilestones) {
      if (totalPoints >= milestone.points) {
        const achievement = await this.prisma.achievement.findFirst({
          where: { condition: `POINTS_${milestone.points}` },
        });

        if (achievement) {
          await this.unlockAchievement(userId, achievement.id);
        }
      }
    }
  }

  /**
   * Verificar conquistas de nível
   */
  private async checkLevelAchievements(userId: string, level: number) {
    const achievement = await this.prisma.achievement.findFirst({
      where: { condition: `LEVEL_${level}` },
    });

    if (achievement) {
      await this.unlockAchievement(userId, achievement.id);
    }
  }

  /**
   * SISTEMA DE RANKING
   */

  /**
   * Atualizar ranking geral
   */
  async updateGlobalRanking() {
    this.logger.log('Atualizando ranking global...');

    // Obter top usuários por pontos
    const topUsers = await this.prisma.$queryRaw<
      Array<{ userId: string; totalPoints: bigint }>
    >`
      SELECT 
        user_id as userId,
        SUM(points) as totalPoints
      FROM user_points
      GROUP BY user_id
      ORDER BY totalPoints DESC
      LIMIT 100
    `;

    // Atualizar ranking
    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const position = i + 1;
      const points = Number(user.totalPoints);

      await this.prisma.ranking.upsert({
        where: {
          userId_type: {
            userId: user.userId,
            type: 'GLOBAL',
          },
        },
        update: {
          position,
          points,
          updatedAt: new Date(),
        },
        create: {
          userId: user.userId,
          type: 'GLOBAL',
          position,
          points,
        },
      });
    }

    this.logger.log(`✅ Ranking global atualizado (${topUsers.length} usuários)`);
  }

  /**
   * Atualizar ranking de disciplina
   */
  async updateDisciplineRanking(disciplineId: string) {
    this.logger.log(`Atualizando ranking da disciplina ${disciplineId}...`);

    // Obter pontos por disciplina
    const topUsers = await this.prisma.$queryRaw<
      Array<{ userId: string; totalPoints: bigint }>
    >`
      SELECT 
        up.user_id as userId,
        SUM(up.points) as totalPoints
      FROM user_points up
      WHERE up.source = 'ATIVIDADE'
        AND EXISTS (
          SELECT 1 FROM activities a 
          WHERE a.id = up.reference_id 
          AND a.discipline_id = ${disciplineId}
        )
      GROUP BY up.user_id
      ORDER BY totalPoints DESC
      LIMIT 50
    `;

    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const position = i + 1;
      const points = Number(user.totalPoints);

      await this.prisma.ranking.upsert({
        where: {
          userId_type_referenceId: {
            userId: user.userId,
            type: 'DISCIPLINA',
            referenceId: disciplineId,
          },
        },
        update: {
          position,
          points,
          updatedAt: new Date(),
        },
        create: {
          userId: user.userId,
          type: 'DISCIPLINA',
          referenceId: disciplineId,
          position,
          points,
        },
      });
    }

    this.logger.log(
      `✅ Ranking da disciplina atualizado (${topUsers.length} alunos)`,
    );
  }

  /**
   * Atualizar ranking de turma
   */
  async updateClassRanking(classId: string) {
    this.logger.log(`Atualizando ranking da turma ${classId}...`);

    // Obter alunos da turma com seus pontos
    const topUsers = await this.prisma.$queryRaw<
      Array<{ userId: string; totalPoints: bigint }>
    >`
      SELECT 
        cs.user_id as userId,
        SUM(up.points) as totalPoints
      FROM class_students cs
      LEFT JOIN user_points up ON up.user_id = cs.user_id
      WHERE cs.class_id = ${classId}
      GROUP BY cs.user_id
      ORDER BY totalPoints DESC
    `;

    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const position = i + 1;
      const points = Number(user.totalPoints) || 0;

      await this.prisma.ranking.upsert({
        where: {
          userId_type_referenceId: {
            userId: user.userId,
            type: 'TURMA',
            referenceId: classId,
          },
        },
        update: {
          position,
          points,
          updatedAt: new Date(),
        },
        create: {
          userId: user.userId,
          type: 'TURMA',
          referenceId: classId,
          position,
          points,
        },
      });
    }

    this.logger.log(`✅ Ranking da turma atualizado (${topUsers.length} alunos)`);
  }

  /**
   * Obter ranking
   */
  async getRanking(
    type: 'GLOBAL' | 'DISCIPLINA' | 'TURMA',
    referenceId?: string,
    limit = 50,
  ) {
    const where: any = { type };
    if (referenceId) {
      where.referenceId = referenceId;
    }

    return this.prisma.ranking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { position: 'asc' },
      take: limit,
    });
  }

  /**
   * Obter posição do usuário no ranking
   */
  async getUserRankingPosition(
    userId: string,
    type: 'GLOBAL' | 'DISCIPLINA' | 'TURMA',
    referenceId?: string,
  ) {
    const where: any = { userId, type };
    if (referenceId) {
      where.referenceId = referenceId;
    }

    return this.prisma.ranking.findUnique({
      where:
        type === 'GLOBAL'
          ? { userId_type: { userId, type } }
          : { userId_type_referenceId: { userId, type, referenceId } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * DASHBOARD DE GAMIFICAÇÃO
   */

  /**
   * Obter estatísticas completas de gamificação do usuário
   */
  async getUserGamificationStats(userId: string) {
    const [totalPoints, levelInfo, achievements, globalRanking] =
      await Promise.all([
        this.getUserTotalPoints(userId),
        this.getUserLevel(userId),
        this.getUserAchievements(userId),
        this.getUserRankingPosition(userId, 'GLOBAL'),
      ]);

    return {
      points: {
        total: totalPoints,
      },
      level: levelInfo,
      achievements: {
        unlocked: achievements.unlockedCount,
        total: achievements.total,
        progress: achievements.progress,
      },
      ranking: {
        global: globalRanking?.position || null,
        points: globalRanking?.points || 0,
      },
    };
  }
}
