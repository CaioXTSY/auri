import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { ListAIGenerationsDto } from './dto/list-ai-generations.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      usersByRole,
      classesCount,
      missionsByType,
      postsCount,
      achievementsCount,
      aiGenerationsLast7d,
      newUsersLast7d,
      missionsCreatedToday,
    ] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.class.count(),
      this.prisma.mission.groupBy({ by: ['type'], _count: { _all: true } }),
      this.prisma.post.count(),
      this.prisma.achievement.count(),
      this.prisma.aIGeneration.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.mission.count({ where: { createdAt: { gte: startOfToday } } }),
    ]);

    const usersTotal = usersByRole.reduce((acc, u) => acc + u._count._all, 0);

    return {
      users: {
        total: usersTotal,
        byRole: Object.fromEntries(usersByRole.map((u) => [u.role, u._count._all])),
        newLast7d: newUsersLast7d,
      },
      classes: { total: classesCount },
      missions: {
        byType: Object.fromEntries(missionsByType.map((m) => [m.type, m._count._all])),
        createdToday: missionsCreatedToday,
      },
      posts: { total: postsCount },
      achievements: { total: achievementsCount },
      aiGenerations: { last7d: aiGenerationsLast7d },
    };
  }

  async listAIGenerations(query: ListAIGenerationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = query.type ? { type: query.type } : {};

    const [data, total] = await Promise.all([
      this.prisma.aIGeneration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          createdAt: true,
          prompt: true,
        },
      }),
      this.prisma.aIGeneration.count({ where }),
    ]);

    return {
      data: data.map((g) => ({
        ...g,
        promptPreview: g.prompt.slice(0, 200),
        prompt: undefined,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAIGeneration(id: string) {
    const generation = await this.prisma.aIGeneration.findUnique({
      where: { id },
      include: {
        missionQuizzes: {
          select: { id: true, title: true, missionId: true, createdAt: true },
        },
      },
    });

    if (!generation) {
      throw new NotFoundException('Geração não encontrada');
    }

    return generation;
  }

  async listAchievements() {
    return this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { points: 'desc' }],
      include: { _count: { select: { userAchievements: true } } },
    });
  }

  async createAchievement(dto: CreateAchievementDto) {
    return this.prisma.achievement.create({ data: dto });
  }

  async updateAchievement(id: string, dto: UpdateAchievementDto) {
    const existing = await this.prisma.achievement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Conquista não encontrada');
    }
    return this.prisma.achievement.update({ where: { id }, data: dto });
  }

  async deleteAchievement(id: string) {
    const existing = await this.prisma.achievement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Conquista não encontrada');
    }
    await this.prisma.achievement.delete({ where: { id } });
    return { message: 'Conquista removida' };
  }
}
