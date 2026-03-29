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
      classEnrollment,
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
      this.prisma.classStudent.findFirst({
        where: { userId },
        orderBy: { enrolledAt: 'desc' },
        select: { classId: true },
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

    let classRanking = null;
    if (classEnrollment?.classId) {
      classRanking = await this.gamificationService.getUserRankingPosition(
        userId,
        'TURMA',
        classEnrollment.classId,
      );

      if (!classRanking) {
        await this.gamificationService.updateClassRanking(classEnrollment.classId);
        classRanking = await this.gamificationService.getUserRankingPosition(
          userId,
          'TURMA',
          classEnrollment.classId,
        );
      }
    }

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
        class: classRanking?.position || null,
        classId: classEnrollment?.classId || null,
      },
      missions,
      streak: gamification.streak,
    };
  }
}
