import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
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

  async getTeacherDashboard(userId: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [classes, submissions, codeSubmissions] = await Promise.all([
      this.prisma.class.findMany({
        where: { createdById: userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          year: true,
          status: true,
          _count: {
            select: {
              students: { where: { user: { role: Role.ALUNO } } },
              activities: true,
              programmingAssignments: true,
            },
          },
        },
      }),
      this.prisma.activitySubmission.findMany({
        where: {
          activity: { class: { createdById: userId } },
          submittedAt: { gte: since },
          status: { not: 'DRAFT' },
        },
        orderBy: [{ submittedAt: 'desc' }, { id: 'asc' }],
        take: 5,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          gradedById: true,
          user: { select: { name: true } },
          activity: {
            select: { id: true, title: true, class: { select: { name: true } } },
          },
        },
      }),
      this.prisma.codeSubmission.findMany({
        where: {
          assignment: { class: { createdById: userId } },
          mode: 'SUBMIT',
          createdAt: { gte: since },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
          user: { select: { name: true } },
          assignment: {
            select: { id: true, title: true, class: { select: { name: true } } },
          },
        },
      }),
    ]);

    const recentSubmissions = [
      ...submissions.map((submission) => ({
        id: submission.id,
        activityId: submission.activity.id,
        activityTitle: submission.activity.title,
        className: submission.activity.class.name,
        studentName: submission.user.name,
        kind: 'ACTIVITY' as const,
        submittedAt: submission.submittedAt!,
        status: submission.status === 'GRADED'
          ? (submission.gradedById ? 'GRADED' : 'AUTOMATIC')
          : submission.status === 'RETURNED' ? 'RETURNED' : 'PENDING_REVIEW',
      })),
      ...codeSubmissions.flatMap((submission) => submission.assignment ? [{
        id: submission.id,
        activityId: submission.assignment.id,
        activityTitle: submission.assignment.title,
        className: submission.assignment.class.name,
        studentName: submission.user.name,
        kind: 'CODE' as const,
        submittedAt: submission.createdAt,
        status: ['PENDING', 'RUNNING'].includes(submission.status)
          ? 'PROCESSING'
          : submission.status === 'INTERNAL_ERROR' ? 'ERROR' : 'AUTOMATIC',
      }] : []),
    ].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
      || a.id.localeCompare(b.id)).slice(0, 5);

    return {
      totals: {
        classes: classes.length,
        activeClasses: classes.filter((classroom) => classroom.status === 'ATIVA').length,
        students: classes.reduce((total, classroom) => total + classroom._count.students, 0),
      },
      classes: classes.map(({ _count, ...classroom }) => ({
        ...classroom,
        studentCount: _count.students,
        activityCount: _count.activities + _count.programmingAssignments,
      })),
      recentSubmissions,
    };
  }

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
