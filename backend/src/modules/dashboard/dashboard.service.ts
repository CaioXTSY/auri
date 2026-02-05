import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { MissionsService } from '../missions/missions.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
    private readonly missionsService: MissionsService,
    private readonly submissionsService: SubmissionsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async getStudentDashboard(userId: string) {
    const [gamification, missions, submissions, upcomingActivities, recentAchievements, classEnrollment] =
      await Promise.all([
        this.gamificationService.getUserGamificationStats(userId),
        this.missionsService.getUserMissionStats(userId),
        this.submissionsService.getUserStats(userId),
        this.activitiesService.findUpcomingForStudent(userId, 5),
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

    const classRanking = classEnrollment?.classId
      ? await this.gamificationService.getUserRankingPosition(
          userId,
          'TURMA',
          classEnrollment.classId,
        )
      : null;

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
        global: gamification.ranking.global,
        class: classRanking?.position || null,
        classId: classEnrollment?.classId || null,
      },
      missions,
      submissions,
      upcomingActivities,
    };
  }
}
