import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { MissionsService } from '../missions/missions.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
    private readonly missionsService: MissionsService,
  ) {}

  async getStudentDashboard(userId: string) {
    const [
      gamification,
      missions,
      recentAchievements,
    ] = await Promise.all([
      this.gamificationService.getUserGamificationStats(userId),
      this.missionsService.getUserMissionStats(userId),
      this.prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        take: 3,
        include: {
          achievement: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
              points: true,
              rarity: true,
              category: true,
            },
          },
        },
      }),
    ]);

    let globalRanking = await this.gamificationService.getUserRankingPosition(
      userId,
      'GLOBAL',
    );

    if (!globalRanking) {
      await this.gamificationService.updateGlobalRanking();
      globalRanking = await this.gamificationService.getUserRankingPosition(
        userId,
        'GLOBAL',
      );
    }

    const nearbyGlobalRanking = globalRanking
      ? await this.gamificationService.getGlobalRankingAroundUser(userId, 5)
      : [];

    return {
      points: gamification.points,
      level: gamification.level,
      achievements: {
        ...gamification.achievements,
        recent: recentAchievements.map((item) => ({
          ...item.achievement,
          unlockedAt: item.unlockedAt,
        })),
      },
      ranking: {
        global: globalRanking?.position || null,
        nearby: nearbyGlobalRanking,
      },
      missions,
      streak: gamification.streak,
    };
  }
}
