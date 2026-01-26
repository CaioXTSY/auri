import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { Judge0Service } from './judge0.service';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [PrismaModule, GamificationModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, Judge0Service],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
