import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QuizGeneratorService } from './quiz-generator.service';

@Injectable()
export class MissionsSchedulerService {
  private readonly logger = new Logger(MissionsSchedulerService.name);

  constructor(private quizGeneratorService: QuizGeneratorService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyMission() {
    try {
      await this.quizGeneratorService.generateDailyQuizMission();
    } catch (error) {
      this.logger.error('Falha na geracao de quiz diario', error);
    }
  }
}
