import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PointsService } from './points.service';

@Injectable()
export class LevelsService {
  private readonly logger = new Logger(LevelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

  calculateLevel(totalPoints: number): number {
    return Math.floor(Math.sqrt(totalPoints / 100));
  }

  calculatePointsForNextLevel(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    return Math.pow(nextLevel, 2) * 100;
  }

  async getUserLevel(userId: string) {
    const totalPoints = await this.pointsService.getUserTotalPoints(userId);
    const currentLevel = this.calculateLevel(totalPoints);
    const pointsForNextLevel = this.calculatePointsForNextLevel(currentLevel);
    const currentLevelPoints = Math.pow(currentLevel, 2) * 100;
    const pointsInCurrentLevel = totalPoints - currentLevelPoints;
    const pointsNeededForNextLevel = pointsForNextLevel - totalPoints;

    return {
      userId,
      totalPoints,
      currentLevel,
      levelName: this.getLevelName(currentLevel),
      pointsInCurrentLevel,
      pointsNeededForNextLevel,
      progressToNextLevel:
        (pointsInCurrentLevel / (pointsForNextLevel - currentLevelPoints)) *
        100,
    };
  }

  private getLevelName(level: number): string {
    const names = [
      'Iniciante',
      'Aprendiz',
      'Programador Junior',
      'Desenvolvedor',
      'Programador Pleno',
      'Desenvolvedor Sênior',
      'Arquiteto',
      'Tech Lead',
      'Especialista',
      'Mestre',
      'Grande Mestre',
      'Lenda',
    ];

    if (level < names.length) {
      return `${names[level]} (Nível ${level})`;
    }

    return `Lenda Nível ${level}`;
  }

  async checkLevelUp(userId: string) {
    const [levelInfo, latestPointEntry] = await Promise.all([
      this.getUserLevel(userId),
      this.prisma.userPoint.findFirst({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { points: true },
      }),
    ]);

    if (!latestPointEntry) {
      return null;
    }

    const previousTotalPoints = Math.max(
      0,
      levelInfo.totalPoints - latestPointEntry.points,
    );
    const previousLevel = this.calculateLevel(previousTotalPoints);

    if (levelInfo.currentLevel <= previousLevel) {
      return null;
    }

    this.logger.log(`Usuário ${userId} subiu para ${levelInfo.levelName}!`);
    return levelInfo.currentLevel;
  }
}
