import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateGlobalRanking() {
    this.logger.log('Atualizando ranking global...');

    const topUsers = await this.prisma.$queryRaw<
      Array<{ userId: string; totalPoints: bigint }>
    >`
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
      const position = i + 1;
      const points = Number(user.totalPoints);

      await this.prisma.ranking.upsert({
        where: {
          userId_type: { userId: user.userId, type: 'GLOBAL' },
        },
        update: { position, points, updatedAt: new Date() },
        create: {
          userId: user.userId,
          type: 'GLOBAL',
          position,
          points,
        },
      });
    }

    this.logger.log(`Ranking global atualizado (${topUsers.length} usuários)`);
  }

  async updateClassRanking(classId: string) {
    this.logger.log(`Atualizando ranking da turma ${classId}...`);

    const topUsers = await this.prisma.$queryRaw<
      Array<{ userId: string; totalPoints: bigint }>
    >`
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
      const position = i + 1;
      const points = Number(user.totalPoints) || 0;

      await this.prisma.ranking.upsert({
        where: {
          userId_type_referenceId: {
            userId: user.userId,
            type: 'TURMA',
            referenceId: classId,
          },
        },
        update: { position, points, updatedAt: new Date() },
        create: {
          userId: user.userId,
          type: 'TURMA',
          referenceId: classId,
          position,
          points,
        },
      });
    }

    this.logger.log(`Ranking da turma atualizado (${topUsers.length} alunos)`);
  }

  async getRanking(
    type: 'GLOBAL' | 'TURMA',
    referenceId?: string,
    limit = 50,
  ) {
    const where: any = { type };
    if (referenceId) {
      where.referenceId = referenceId;
    }

    return this.prisma.ranking.findMany({
      where: { ...where, user: { role: 'ALUNO' } },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { position: 'asc' },
      take: limit,
    });
  }

  async getUserRankingPosition(
    userId: string,
    type: 'GLOBAL' | 'TURMA',
    referenceId?: string,
  ) {
    return this.prisma.ranking.findUnique({
      where:
        type === 'GLOBAL'
          ? { userId_type: { userId, type } }
          : { userId_type_referenceId: { userId, type, referenceId } },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
  }
}
