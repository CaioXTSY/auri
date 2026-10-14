import { awardOnce, awardScoreDelta, lockRewardUser } from '../gamification/reward-store';
import { RankingService } from '../gamification/ranking.service';
import { PrismaService } from '../../prisma/prisma.service';
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

      const enrollments = await this.prisma.classStudent.findMany({ where: { userId: submission.userId }, select: { classId: true } });
      for (const enrollment of enrollments) await this.updateClassRanking(enrollment.classId);

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
        mode: true,
        score: true,
        assignment: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!submission?.assignmentId || submission.score <= 0 || submission.mode !== CodeSubmissionMode.SUBMIT) {
      return 0;
    }

    return this.prisma.$transaction(async (tx) => {
      await lockRewardUser(tx, submission.userId);
      return awardScoreDelta(tx, { userId: submission.userId, points: submission.score, source: 'programming_assignment', description: `Atividade de programação: ${submission.assignment?.title ?? submission.assignmentId}`, referenceId: submission.assignmentId! });
    });
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

    return this.prisma.$transaction(async (tx) => {
      await lockRewardUser(tx, userId);
      const existing = await tx.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId: achievement.id } } });
      if (existing) return false;
      await tx.userAchievement.create({ data: { userId, achievementId: achievement.id } });
      await awardOnce(tx, { userId, points: achievement.points, source: 'CONQUISTA', description: `Desbloqueou: ${achievement.name}`, referenceId: achievement.id });
      await tx.notification.create({ data: { userId, type: NotificationType.CONQUISTA, title: `Conquista desbloqueada: ${achievement.name}`, message: `${achievement.description} +${achievement.points} XP.` } });
      return true;
    });
  }

  private async getUserTotalPoints(userId: string) {
    const result = await this.prisma.userPoint.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    return result._sum.points || 0;
  }

  private updateGlobalRanking() {
    return new RankingService(this.prisma as PrismaService).updateGlobalRanking();
  }
  private updateClassRanking(classId: string) {
    return new RankingService(this.prisma as PrismaService).updateClassRanking(classId);
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
