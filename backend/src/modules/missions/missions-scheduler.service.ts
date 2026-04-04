import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QuizGeneratorService } from './quiz-generator.service';

@Injectable()
export class MissionsSchedulerService {
  private readonly logger = new Logger(MissionsSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private quizGeneratorService: QuizGeneratorService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyMissions() {
    try {
      const now = new Date();

      const expiredMissions = await this.prisma.mission.findMany({
        where: { type: 'DIARIA', endDate: { lt: now } },
        select: { id: true },
      });

      for (const mission of expiredMissions) {
        await this.prisma.userMission.updateMany({
          where: { missionId: mission.id, status: 'EM_PROGRESSO' },
          data: { status: 'EXPIRADA' },
        });
      }

      this.logger.log(`Reset de ${expiredMissions.length} missões diárias concluído`);
      await this.quizGeneratorService.generateDailyQuizMission();
    } catch (error) {
      this.logger.error('Falha no reset de missões diárias', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async resetWeeklyMissions() {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const expiredMissions = await this.prisma.mission.findMany({
        where: {
          type: 'SEMANAL',
          endDate: { lt: now },
        },
      });

      for (const mission of expiredMissions) {
        await this.prisma.userMission.updateMany({
          where: {
            missionId: mission.id,
            status: 'EM_PROGRESSO',
          },
          data: {
            status: 'EXPIRADA',
          },
        });

        await this.prisma.mission.create({
          data: {
            title: mission.title,
            description: mission.description,
            type: 'SEMANAL',
            points: mission.points,
            startDate: startOfWeek,
            endDate: endOfWeek,
            classId: mission.classId,
            createdById: mission.createdById,
          },
        });
      }

      this.logger.log(`Reset de ${expiredMissions.length} missões semanais concluído`);
    } catch (error) {
      this.logger.error('Falha no reset de missões semanais', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async expireMissions() {
    try {
      const now = new Date();

      const expiredMissions = await this.prisma.mission.findMany({
        where: {
          endDate: { lt: now },
        },
        select: { id: true },
      });

      const missionIds = expiredMissions.map((m) => m.id);

      if (missionIds.length > 0) {
        const result = await this.prisma.userMission.updateMany({
          where: {
            missionId: { in: missionIds },
            status: { in: ['NAO_INICIADA', 'EM_PROGRESSO'] },
          },
          data: {
            status: 'EXPIRADA',
          },
        });

        this.logger.log(`${result.count} missões de usuários foram expiradas`);
      }
    } catch (error) {
      this.logger.error('Falha na expiração de missões', error);
    }
  }
}
