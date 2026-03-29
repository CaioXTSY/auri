import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MissionStatus } from '@prisma/client';

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
   * Obter estatísticas gerais do usuário
   */
  async getUserStats(userId: string) {
    const [levelInfo, achievements, user] = await Promise.all([
      this.getUserLevel(userId),
      this.getUserAchievements(userId, 1, 1),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, longestStreak: true, streakLastDate: true },
      }),
    ]);

    return {
      userId,
      level: levelInfo.currentLevel,
      levelName: levelInfo.levelName,
      currentXp: levelInfo.totalPoints,
      nextLevelXp: levelInfo.pointsNeededForNextLevel + levelInfo.totalPoints,
      progress: levelInfo.progressToNextLevel,
      achievementsCount: achievements.meta.totalUnlocked,
      totalAchievements: achievements.meta.totalAchievements,
      currentStreak: user ? this.getEffectiveStreak(user) : 0,
      longestStreak: user?.longestStreak ?? 0,
    };
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
   * Obter conquistas do usuário (Paginado)
   */
  async getUserAchievements(
    userId: string,
    page = 1,
    limit = 10,
    filter: 'ALL' | 'UNLOCKED' | 'LOCKED' = 'ALL',
  ) {
    const skip = (page - 1) * limit;

    // Totais globais (para estatísticas rápidas)
    const totalAchievementsCount = await this.prisma.achievement.count();
    const totalUnlockedCount = await this.prisma.userAchievement.count({
      where: { userId },
    });

    let data = [];
    let total = 0;

    if (filter === 'UNLOCKED') {
      total = totalUnlockedCount;
      const userAchievements = await this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        skip,
        take: limit,
        orderBy: { unlockedAt: 'desc' },
      });

      data = userAchievements.map((ua) => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
        isUnlocked: true,
      }));
    } else if (filter === 'LOCKED') {
      const unlocked = await this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      });
      const unlockedIds = unlocked.map((u) => u.achievementId);

      total = await this.prisma.achievement.count({
        where: { id: { notIn: unlockedIds } },
      });

      const locked = await this.prisma.achievement.findMany({
        where: { id: { notIn: unlockedIds } },
        skip,
        take: limit,
        orderBy: [{ category: 'asc' }, { points: 'desc' }],
      });

      data = locked.map((a) => ({
        ...a,
        unlockedAt: null,
        isUnlocked: false,
      }));
    } else {
      // ALL
      total = totalAchievementsCount;
      const achievements = await this.prisma.achievement.findMany({
        skip,
        take: limit,
        orderBy: [{ category: 'asc' }, { points: 'desc' }],
      });

      const pageIds = achievements.map((a) => a.id);
      const unlockedInPage = await this.prisma.userAchievement.findMany({
        where: { userId, achievementId: { in: pageIds } },
        select: { achievementId: true, unlockedAt: true },
      });

      const unlockedMap = new Map(
        unlockedInPage.map((u) => [u.achievementId, u.unlockedAt]),
      );

      data = achievements.map((a) => ({
        ...a,
        unlockedAt: unlockedMap.get(a.id) || null,
        isUnlocked: unlockedMap.has(a.id),
      }));
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        totalUnlocked: totalUnlockedCount,
        totalAchievements: totalAchievementsCount,
      },
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
      // Verificar se usuário completou alguma missão
      const completedMissionsCount = await this.prisma.userMission.count({
        where: {
          userId,
          status: MissionStatus.CONCLUIDA,
        },
      });

      if (completedMissionsCount > 0) {
        await this.unlockAchievement(userId, achievement.id);
      }
    }
  }

  /**
   * Verificar conquistas de quiz
   */
  async checkQuizAchievements(userId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { condition: 'FIRST_QUIZ_COMPLETED' },
    });

    if (achievement) {
      const completedQuizCount = await this.prisma.missionQuizAttempt.count({
        where: { userId },
      });

      if (completedQuizCount > 0) {
        await this.unlockAchievement(userId, achievement.id);
      }
    }
  }

  /**
   * SISTEMA DE STREAK
   */

  /**
   * Retorna o streak efetivo do usuário (0 se quebrado, sem tocar no banco)
   */
  private getEffectiveStreak(user: {
    currentStreak: number;
    streakLastDate: Date | null;
  }): number {
    if (!user.streakLastDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last = new Date(user.streakLastDate);
    last.setHours(0, 0, 0, 0);
    return last >= yesterday ? user.currentStreak : 0;
  }

  /**
   * Incrementa o streak ao acertar o quiz diário (idempotente para o mesmo dia)
   */
  async updateStreak(userId: string): Promise<{ newStreak: number; isNewRecord: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, streakLastDate: true },
    });

    if (!user) return { newStreak: 0, isNewRecord: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last = user.streakLastDate ? new Date(user.streakLastDate) : null;
    if (last) last.setHours(0, 0, 0, 0);

    // Idempotência: já foi atualizado hoje
    if (last && last >= today) {
      return { newStreak: user.currentStreak, isNewRecord: false };
    }

    // Consecutivo (ontem) → incrementa; senão → reinicia em 1
    const newStreak = last && last >= yesterday ? user.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, user.longestStreak);
    const isNewRecord = newLongest > user.longestStreak;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        streakLastDate: today,
      },
    });

    // Bônus de pontos nos marcos
    const bonusMap: Record<number, number> = { 7: 50, 14: 100, 30: 250, 100: 500 };
    const bonus = bonusMap[newStreak];
    if (bonus) {
      await this.addPoints(
        userId,
        bonus,
        'STREAK_BONUS',
        `Bônus de sequência: ${newStreak} dias consecutivos!`,
      );
    }

    this.logger.log(`Streak atualizado para usuário ${userId}: ${newStreak} dias`);
    return { newStreak, isNewRecord };
  }

  /**
   * Desbloqueia conquistas de streak para os marcos atingidos
   */
  async checkStreakAchievements(userId: string, currentStreak: number): Promise<void> {
    const milestones = [3, 7, 14, 30, 100];
    for (const days of milestones) {
      if (currentStreak >= days) {
        const achievement = await this.prisma.achievement.findUnique({
          where: { condition: `STREAK_${days}` },
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
    type: 'GLOBAL' | 'TURMA',
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
    type: 'GLOBAL' | 'TURMA',
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
    const [totalPoints, levelInfo, achievements, globalRanking, user] =
      await Promise.all([
        this.getUserTotalPoints(userId),
        this.getUserLevel(userId),
        this.getUserAchievements(userId, 1, 1),
        this.getUserRankingPosition(userId, 'GLOBAL'),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { currentStreak: true, longestStreak: true, streakLastDate: true },
        }),
      ]);

    return {
      points: {
        total: totalPoints,
      },
      level: levelInfo,
      achievements: {
        unlocked: achievements.meta.totalUnlocked,
        total: achievements.meta.totalAchievements,
        progress:
          achievements.meta.totalAchievements > 0
            ? (achievements.meta.totalUnlocked /
                achievements.meta.totalAchievements) *
              100
            : 0,
      },
      ranking: {
        global: globalRanking?.position || null,
        points: globalRanking?.points || 0,
      },
      streak: {
        current: user ? this.getEffectiveStreak(user) : 0,
        longest: user?.longestStreak ?? 0,
        lastDate: user?.streakLastDate ?? null,
      },
    };
  }
}
