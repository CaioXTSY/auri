import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { awardOnce, lockRewardUser } from './reward-store';
import { PointsService } from './points.service';
import { LevelsService } from './levels.service';
import { MissionStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { RankingService } from './ranking.service';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
    private readonly levelsService: LevelsService,
    private readonly notificationsService: NotificationsService,
    private readonly rankingService: RankingService,
  ) {}

  private async refreshProgressionAfterAchievementPoints(userId: string) {
    const newLevel = await this.levelsService.checkLevelUp(userId);

    if (newLevel !== null) {
      await this.checkLevelAchievements(userId, newLevel);
    }

    await this.checkPointsAchievements(userId);
    await this.rankingService.updateGlobalRanking();
    const enrollments = await this.prisma.classStudent.findMany({ where: { userId }, select: { classId: true } });
    for (const enrollment of enrollments) await this.rankingService.updateClassRanking(enrollment.classId);
  }

  async getAllAchievements() {
    return this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { points: 'desc' }],
    });
  }

  async unlockAchievement(userId: string, achievementId: string) {
    const { userAchievement, created } = await this.prisma.$transaction(async (tx) => {
      await lockRewardUser(tx, userId);
      const existing = await tx.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId } }, include: { achievement: true } });
      if (existing) return { userAchievement: existing, created: false };
      const userAchievement = await tx.userAchievement.create({ data: { userId, achievementId }, include: { achievement: true } });
      await awardOnce(tx, { userId, points: userAchievement.achievement.points, source: 'CONQUISTA', description: `Desbloqueou: ${userAchievement.achievement.name}`, referenceId: achievementId });
      return { userAchievement, created: true };
    });
    if (!created) return userAchievement;

    await this.refreshProgressionAfterAchievementPoints(userId);

    await this.notificationsService.createNotification({
      userId,
      type: NotificationType.CONQUISTA,
      title: `Conquista desbloqueada: ${userAchievement.achievement.name}`,
      message: `${userAchievement.achievement.description} +${userAchievement.achievement.points} XP.`,
    });

    this.logger.log(`Usuário ${userId} desbloqueou: ${userAchievement.achievement.name}`);

    return userAchievement;
  }

  async getUserAchievements(
    userId: string,
    page = 1,
    limit = 10,
    filter: 'ALL' | 'UNLOCKED' | 'LOCKED' = 'ALL',
  ) {
    const skip = (page - 1) * limit;

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
        unlockedAt: null as Date | null,
        isUnlocked: false,
      }));
    } else {
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

      const unlockedMap = new Map(unlockedInPage.map((u) => [u.achievementId, u.unlockedAt]));

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

  async checkLoginAchievements(userId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { condition: 'FIRST_LOGIN' },
    });
    if (achievement) {
      await this.unlockAchievement(userId, achievement.id);
    }
  }

  async checkClassJoinAchievements(userId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { condition: 'FIRST_CLASS_JOIN' },
    });
    if (achievement) {
      await this.unlockAchievement(userId, achievement.id);
    }
  }

  async checkMissionAchievements(userId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { condition: 'FIRST_MISSION_COMPLETED' },
    });

    if (achievement) {
      const completedMissionsCount = await this.prisma.userMission.count({
        where: { userId, status: MissionStatus.CONCLUIDA },
      });

      if (completedMissionsCount > 0) {
        await this.unlockAchievement(userId, achievement.id);
      }
    }
  }

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

  async checkPointsAchievements(userId: string) {
    const totalPoints = await this.pointsService.getUserTotalPoints(userId);

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

  async checkLevelAchievements(userId: string, level: number) {
    const achievement = await this.prisma.achievement.findFirst({
      where: { condition: `LEVEL_${level}` },
    });

    if (achievement) {
      await this.unlockAchievement(userId, achievement.id);
    }
  }
}
