import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateGlobalRanking() {
    return this.rebuild('GLOBAL', 'GLOBAL');
  }

  private async rebuild(type: 'GLOBAL' | 'TURMA', referenceId: string) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // A common lock prevents concurrent snapshot writers from interleaving.
            await tx.$queryRaw`SELECT id FROM users ORDER BY id FOR UPDATE`;
            const rows = await tx.$queryRaw<
              Array<{ userId: string; totalPoints: bigint }>
            >(Prisma.sql`
            SELECT u.id AS userId, COALESCE(SUM(up.points), 0) AS totalPoints
            FROM users u LEFT JOIN user_points up ON up.user_id = u.id
            WHERE u.role = 'ALUNO' ${type === 'TURMA' ? Prisma.sql`AND EXISTS (SELECT 1 FROM class_students cs WHERE cs.user_id = u.id AND cs.class_id = ${referenceId})` : Prisma.empty}
            GROUP BY u.id ORDER BY totalPoints DESC, u.id ASC
          `);
            await tx.ranking.deleteMany({ where: { type, referenceId, userId: { notIn: rows.map((row) => row.userId) } } });
            for (const [index, row] of rows.entries()) {
              // Keep IDs stable for eligible participants; remove only stale entries.
              const data = { position: index + 1, points: Number(row.totalPoints) };
              await tx.ranking.upsert({ where: { userId_type_referenceId: { userId: row.userId, type, referenceId } },
                update: data, create: { userId: row.userId, type, referenceId, ...data } });
            }
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15000 },
        );
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') ||
          attempt === 2
        )
          throw error;
      }
    }
  }

  async updateClassRanking(classId: string) {
    return this.rebuild('TURMA', classId);
  }

  async getRanking(type: 'GLOBAL' | 'TURMA', referenceId?: string, limit = 50) {
    if (type === 'TURMA' && !referenceId)
      throw new Error('referenceId obrigatório para ranking de turma');
    await this.rebuild(type, type === 'GLOBAL' ? 'GLOBAL' : referenceId!);
    const where: any =
      type === 'GLOBAL'
        ? { type, referenceId: 'GLOBAL' }
        : { type, ...(referenceId ? { referenceId } : {}) };

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

  async getUserRankingPosition(userId: string, type: 'GLOBAL' | 'TURMA', referenceId?: string) {
    if (type === 'TURMA' && !referenceId)
      throw new Error('referenceId obrigatório para ranking de turma');
    await this.rebuild(type, type === 'GLOBAL' ? 'GLOBAL' : referenceId!);
    return this.prisma.ranking.findUnique({
      where:
        type === 'GLOBAL'
          ? {
              userId_type_referenceId: {
                userId,
                type,
                referenceId: 'GLOBAL',
              },
            }
          : { userId_type_referenceId: { userId, type, referenceId } },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
  }

  async getGlobalRankingAroundUser(userId: string, size = 5) {
    const current = await this.getUserRankingPosition(userId, 'GLOBAL');
    if (!current) {
      return [];
    }

    const total = await this.prisma.ranking.count({
      where: {
        type: 'GLOBAL',
        referenceId: 'GLOBAL',
        user: { role: 'ALUNO' },
      },
    });
    const positionsBefore = Math.floor((size - 1) / 2);
    const startPosition = Math.min(
      Math.max(1, current.position - positionsBefore),
      Math.max(1, total - size + 1),
    );

    return this.prisma.ranking.findMany({
      where: {
        type: 'GLOBAL',
        referenceId: 'GLOBAL',
        position: { gte: startPosition },
        user: { role: 'ALUNO' },
      },
      select: {
        position: true,
        points: true,
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { position: 'asc' },
      take: size,
    });
  }
}
