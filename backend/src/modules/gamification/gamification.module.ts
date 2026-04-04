import { Module } from '@nestjs/common';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { PointsService } from './points.service';
import { LevelsService } from './levels.service';
import { AchievementsService } from './achievements.service';
import { RankingService } from './ranking.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GamificationController],
  providers: [
    GamificationService,
    PointsService,
    LevelsService,
    AchievementsService,
    RankingService,
  ],
  exports: [GamificationService],
})
export class GamificationModule {}
