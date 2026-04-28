import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PointsService } from './points.service';
import { LevelsService } from './levels.service';
import { AchievementsService } from './achievements.service';
import { RankingService } from './ranking.service';

/**
 * Facade de Gamificação
 * Delega para serviços especializados e orquestra operações compostas (streak, stats)
 */
@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
    private readonly levelsService: LevelsService,
    private readonly achievementsService: AchievementsService,
    private readonly rankingService: RankingService,
  ) {}

  async refreshProgressionAfterPointsChange(userId: string) {
    const newLevel = await this.levelsService.checkLevelUp(userId);

    if (newLevel !== null) {
      await this.achievementsService.checkLevelAchievements(userId, newLevel);
    }

    await this.achievementsService.checkPointsAchievements(userId);
  }

  addPoints(userId: string, points: number, source: string, description: string, referenceId?: string) {
    return this.pointsService.addPoints(userId, points, source, description, referenceId).then(async (userPoint) => {
      await this.refreshProgressionAfterPointsChange(userId);
      return userPoint;
    });
  }

  getUserTotalPoints(userId: string) {
    return this.pointsService.getUserTotalPoints(userId);
  }

  getUserPointsHistory(userId: string, limit?: number) {
    return this.pointsService.getUserPointsHistory(userId, limit);
  }

  getUserLevel(userId: string) {
    return this.levelsService.getUserLevel(userId);
  }

  getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }

  unlockAchievement(userId: string, achievementId: string) {
    return this.achievementsService.unlockAchievement(userId, achievementId);
  }

  getUserAchievements(userId: string, page?: number, limit?: number, filter?: 'ALL' | 'UNLOCKED' | 'LOCKED') {
    return this.achievementsService.getUserAchievements(userId, page, limit, filter);
  }

  checkLoginAchievements(userId: string) {
    return this.achievementsService.checkLoginAchievements(userId);
  }

  checkClassJoinAchievements(userId: string) {
    return this.achievementsService.checkClassJoinAchievements(userId);
  }

  checkMissionAchievements(userId: string) {
    return this.achievementsService.checkMissionAchievements(userId);
  }

  checkQuizAchievements(userId: string) {
    return this.achievementsService.checkQuizAchievements(userId);
  }

  checkStreakAchievements(userId: string, currentStreak: number) {
    return this.achievementsService.checkStreakAchievements(userId, currentStreak);
  }

  updateGlobalRanking() {
    return this.rankingService.updateGlobalRanking();
  }

  updateClassRanking(classId: string) {
    return this.rankingService.updateClassRanking(classId);
  }

  getRanking(type: 'GLOBAL' | 'TURMA', referenceId?: string, limit?: number) {
    return this.rankingService.getRanking(type, referenceId, limit);
  }

  getUserRankingPosition(userId: string, type: 'GLOBAL' | 'TURMA', referenceId?: string) {
    return this.rankingService.getUserRankingPosition(userId, type, referenceId);
  }

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

    if (last && last >= today) {
      return { newStreak: user.currentStreak, isNewRecord: false };
    }

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

  async getUserGamificationStats(userId: string) {
    const [totalPoints, levelInfo, achievements, globalRanking, user] =
      await Promise.all([
        this.pointsService.getUserTotalPoints(userId),
        this.levelsService.getUserLevel(userId),
        this.achievementsService.getUserAchievements(userId, 1, 1),
        this.rankingService.getUserRankingPosition(userId, 'GLOBAL'),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { currentStreak: true, longestStreak: true, streakLastDate: true },
        }),
      ]);

    return {
      points: { total: totalPoints },
      level: levelInfo,
      achievements: {
        unlocked: achievements.meta.totalUnlocked,
        total: achievements.meta.totalAchievements,
        progress:
          achievements.meta.totalAchievements > 0
            ? (achievements.meta.totalUnlocked / achievements.meta.totalAchievements) * 100
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
