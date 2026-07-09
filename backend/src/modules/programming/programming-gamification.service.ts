import {
  CodeSubmissionMode,
  CodeSubmissionStatus,
  NotificationType,
  PrismaClient,
} from '@prisma/client';

export class ProgrammingGamificationService {
  constructor(private readonly prisma: PrismaClient) {}

  async processSubmission(submissionId: string, finalStatus: CodeSubmissionStatus) {
    const pointsAwarded = await this.awardProgrammingPoints(submissionId);

    await this.checkProgrammingAchievements(submissionId, finalStatus);

    const submission = await this.prisma.codeSubmission.findUnique({
      where: { id: submissionId },
      select: {
        userId: true,
        assignment: { select: { classId: true } },
      },
    });

    if (submission) {
      await this.refreshProgressionAfterPointsChange(submission.userId);

      if (submission.assignment?.classId) {
        await this.updateClassRanking(submission.assignment.classId);
      }

      await this.updateGlobalRanking();
    }

    return pointsAwarded;
  }

  private async awardProgrammingPoints(submissionId: string) {
    const submission = await this.prisma.codeSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        assignmentId: true,
        score: true,
        assignment: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!submission?.assignmentId || submission.score <= 0) {
      return 0;
    }

    const bestPrevious = await this.prisma.codeSubmission.findFirst({
      where: {
        id: { not: submission.id },
        userId: submission.userId,
        assignmentId: submission.assignmentId,
        mode: CodeSubmissionMode.SUBMIT,
        status: {
          in: [CodeSubmissionStatus.ACCEPTED, CodeSubmissionStatus.WRONG_ANSWER],
        },
      },
      orderBy: { score: 'desc' },
      select: { score: true },
    });

    const delta = Math.max(0, submission.score - (bestPrevious?.score ?? 0));
    if (delta <= 0) {
      return 0;
    }

    await this.prisma.userPoint.create({
      data: {
        userId: submission.userId,
        points: delta,
        source: 'programming_assignment',
        description: `Atividade de programacao: ${submission.assignment?.title ?? submission.assignmentId}`,
        referenceId: submission.assignmentId,
      },
    });

    return delta;
  }

  private async checkProgrammingAchievements(
    submissionId: string,
    finalStatus: CodeSubmissionStatus,
  ) {
    const submission = await this.prisma.codeSubmission.findUnique({
      where: { id: submissionId },
      select: {
        userId: true,
        createdAt: true,
      },
    });

    if (!submission) {
      return;
    }

    await this.unlockAchievementByCondition(submission.userId, 'FIRST_SUBMISSION');
    await this.checkSubmissionTimingAchievements(submission.userId, submission.createdAt);

    if (finalStatus === CodeSubmissionStatus.ACCEPTED) {
      await this.unlockAchievementByCondition(submission.userId, 'FIRST_APPROVED');
      await this.unlockAchievementByCondition(submission.userId, 'PERFECT_SUBMISSION');
    }

    const acceptedCount = await this.prisma.codeSubmission.count({
      where: {
        userId: submission.userId,
        mode: CodeSubmissionMode.SUBMIT,
        status: CodeSubmissionStatus.ACCEPTED,
      },
    });

    for (const milestone of [10, 25, 50, 100, 250, 500]) {
      if (acceptedCount >= milestone) {
        await this.unlockAchievementByCondition(submission.userId, `APPROVED_${milestone}`);
      }
    }

    const languages = await this.prisma.codeSubmission.findMany({
      where: {
        userId: submission.userId,
        mode: CodeSubmissionMode.SUBMIT,
        status: {
          in: [CodeSubmissionStatus.ACCEPTED, CodeSubmissionStatus.WRONG_ANSWER],
        },
      },
      distinct: ['language'],
      select: { language: true },
    });

    if (languages.length >= 2) {
      await this.unlockAchievementByCondition(submission.userId, 'POLYGLOT');
    }
  }

  private async checkSubmissionTimingAchievements(userId: string, date: Date) {
    const saoPauloDateParts = this.getSaoPauloDateParts(date);

    if (saoPauloDateParts.hour >= 0 && saoPauloDateParts.hour < 4) {
      await this.unlockAchievementByCondition(userId, 'NIGHT_OWL');
    }

    if (saoPauloDateParts.hour >= 5 && saoPauloDateParts.hour < 9) {
      await this.unlockAchievementByCondition(userId, 'EARLY_BIRD');
    }

    if (saoPauloDateParts.weekday === 'Sat' || saoPauloDateParts.weekday === 'Sun') {
      await this.unlockAchievementByCondition(userId, 'WEEKEND_WARRIOR');
    }
  }

  private async refreshProgressionAfterPointsChange(userId: string) {
    const totalPoints = await this.getUserTotalPoints(userId);

    for (const milestone of [100, 500, 1000, 5000, 10000]) {
      if (totalPoints >= milestone) {
        await this.unlockAchievementByCondition(userId, `POINTS_${milestone}`);
      }
    }

    const currentLevel = Math.floor(Math.sqrt(totalPoints / 100));
    for (const level of [5, 10]) {
      if (currentLevel >= level) {
        await this.unlockAchievementByCondition(userId, `LEVEL_${level}`);
      }
    }
  }

  private async unlockAchievementByCondition(userId: string, condition: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { condition },
    });

    if (!achievement) {
      return false;
    }

    const existing = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing) {
      return false;
    }

    await this.prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
    });

    if (achievement.points > 0) {
      await this.prisma.userPoint.create({
        data: {
          userId,
          points: achievement.points,
          source: 'CONQUISTA',
          description: `Desbloqueou: ${achievement.name}`,
          referenceId: achievement.id,
        },
      });
    }

    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.CONQUISTA,
        title: `Conquista desbloqueada: ${achievement.name}`,
        message: `${achievement.description} +${achievement.points} XP.`,
      },
    });

    return true;
  }

  private async getUserTotalPoints(userId: string) {
    const result = await this.prisma.userPoint.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    return result._sum.points || 0;
  }

  private async updateGlobalRanking() {
    const topUsers = await this.prisma.$queryRaw<Array<{ userId: string; totalPoints: bigint }>>`
      SELECT
        user_id as userId,
        SUM(points) as totalPoints
      FROM user_points
      GROUP BY user_id
      ORDER BY totalPoints DESC
      LIMIT 100
    `;

    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      await this.prisma.ranking.upsert({
        where: {
          userId_type_referenceId: {
            userId: user.userId,
            type: 'GLOBAL',
            referenceId: 'GLOBAL',
          },
        },
        update: {
          position: i + 1,
          points: Number(user.totalPoints),
          updatedAt: new Date(),
        },
        create: {
          userId: user.userId,
          type: 'GLOBAL',
          referenceId: 'GLOBAL',
          position: i + 1,
          points: Number(user.totalPoints),
        },
      });
    }
  }

  private async updateClassRanking(classId: string) {
    const topUsers = await this.prisma.$queryRaw<Array<{ userId: string; totalPoints: bigint }>>`
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
      await this.prisma.ranking.upsert({
        where: {
          userId_type_referenceId: {
            userId: user.userId,
            type: 'TURMA',
            referenceId: classId,
          },
        },
        update: {
          position: i + 1,
          points: Number(user.totalPoints) || 0,
          updatedAt: new Date(),
        },
        create: {
          userId: user.userId,
          type: 'TURMA',
          referenceId: classId,
          position: i + 1,
          points: Number(user.totalPoints) || 0,
        },
      });
    }
  }

  private getSaoPauloDateParts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
    const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';

    return { hour, weekday };
  }
}
