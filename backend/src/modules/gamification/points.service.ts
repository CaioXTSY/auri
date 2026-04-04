import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addPoints(
    userId: string,
    points: number,
    source: string,
    description: string,
    referenceId?: string,
  ) {
    this.logger.log(
      `Adicionando ${points} pontos para usuário ${userId} - ${source}`,
    );

    return this.prisma.userPoint.create({
      data: { userId, points, source, description, referenceId },
    });
  }

  async getUserTotalPoints(userId: string): Promise<number> {
    const result = await this.prisma.userPoint.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    return result._sum.points || 0;
  }

  async getUserPointsHistory(userId: string, limit = 50) {
    return this.prisma.userPoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
