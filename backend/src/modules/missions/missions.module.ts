import { Module } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionQuizService } from './mission-quiz.service';
import { QuizGeneratorService } from './quiz-generator.service';
import { MissionsSchedulerService } from './missions-scheduler.service';
import { MissionsController } from './missions.controller';
import { QuizReviewService } from './quiz-review.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [PrismaModule, GamificationModule],
  controllers: [MissionsController],
  providers: [
    MissionsService,
    QuizReviewService,
    MissionQuizService,
    QuizGeneratorService,
    MissionsSchedulerService,
  ],
  exports: [MissionsService],
})
export class MissionsModule {}
