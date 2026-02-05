import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';
import { MissionsModule } from '../missions/missions.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    PrismaModule,
    GamificationModule,
    MissionsModule,
    SubmissionsModule,
    ActivitiesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
