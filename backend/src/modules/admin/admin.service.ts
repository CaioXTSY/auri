import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
      quizAttemptsTotal,
      quizAttemptsCorrect,
      activeUsersLast7d,
      streakAgg,
    ] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.class.count(),
      this.prisma.mission.groupBy({ by: ['type'], _count: { _all: true } }),
      this.prisma.post.count(),
      this.prisma.achievement.count(),
      this.prisma.aIGeneration.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.mission.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.missionQuizAttempt.count(),
      this.prisma.missionQuizAttempt.count({ where: { isCorrect: true } }),
      this.prisma.missionQuizAttempt
        .findMany({
          where: { answeredAt: { gte: sevenDaysAgo } },
          distinct: ['userId'],
          select: { userId: true },
        })
        .then((rows) => rows.length),
      this.prisma.user.aggregate({
        where: { role: 'ALUNO' },
        _avg: { currentStreak: true },
      }),
    ]);

    const usersTotal = usersByRole.reduce((acc, u) => acc + u._count._all, 0);
    const quizAccuracy = quizAttemptsTotal > 0 ? quizAttemptsCorrect / quizAttemptsTotal : 0;

    return {
      users: {
        total: usersTotal,
        byRole: Object.fromEntries(usersByRole.map((u) => [u.role, u._count._all])),
        newLast7d: newUsersLast7d,
        activeLast7d: activeUsersLast7d,
      },
      classes: { total: classesCount },
      missions: {
        byType: Object.fromEntries(missionsByType.map((m) => [m.type, m._count._all])),
        createdToday: missionsCreatedToday,
      },
      posts: { total: postsCount },
      achievements: { total: achievementsCount },
      aiGenerations: { last7d: aiGenerationsLast7d },
      quiz: {
        totalAttempts: quizAttemptsTotal,
        correctAttempts: quizAttemptsCorrect,
        accuracy: Number(quizAccuracy.toFixed(4)),
      },
      streaks: {
        averageCurrent: Number((streakAgg._avg.currentStreak ?? 0).toFixed(2)),
      },
    };
  }

  async getTimeseries(days = 30) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - (days - 1));

    const [users, missions, attempts] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.mission.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.missionQuizAttempt.findMany({
        where: { answeredAt: { gte: start } },
        select: { answeredAt: true, isCorrect: true },
      }),
    ]);

    const toKey = (d: Date) => d.toISOString().slice(0, 10);
    const buckets: Record<
      string,
      { users: number; missions: number; correct: number; wrong: number }
    > = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      buckets[toKey(d)] = { users: 0, missions: 0, correct: 0, wrong: 0 };
    }

    for (const u of users) {
      const key = toKey(u.createdAt);
      if (buckets[key]) buckets[key].users++;
    }
    for (const m of missions) {
      const key = toKey(m.createdAt);
      if (buckets[key]) buckets[key].missions++;
    }
    for (const a of attempts) {
      const key = toKey(a.answeredAt);
      if (!buckets[key]) continue;
      if (a.isCorrect) buckets[key].correct++;
      else buckets[key].wrong++;
    }

    return Object.entries(buckets).map(([date, v]) => ({ date, ...v }));
  }

  async getTopLists() {
    const [classes, achievements] = await Promise.all([
      this.prisma.class.findMany({
        take: 5,
        orderBy: { students: { _count: 'desc' } },
        select: {
          id: true,
          name: true,
          year: true,
          _count: { select: { students: true } },
        },
      }),
      this.prisma.achievement.findMany({
        take: 5,
        orderBy: { userAchievements: { _count: 'desc' } },
        select: {
          id: true,
          name: true,
          category: true,
          points: true,
          _count: { select: { userAchievements: true } },
        },
      }),
    ]);

    return {
      topClasses: classes.map((c) => ({
        id: c.id,
        name: c.name,
        label: String(c.year),
        students: c._count.students,
      })),
      topAchievements: achievements.map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        points: a.points,
        unlocks: a._count.userAchievements,
      })),
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
        prompt: undefined as undefined,
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
    try {
      return await this.prisma.achievement.create({ data: dto });
    } catch (error) {
      this.handleAchievementUniqueError(error);
    }
  }

  async updateAchievement(id: string, dto: UpdateAchievementDto) {
    const existing = await this.prisma.achievement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Conquista não encontrada');
    }
    try {
      return await this.prisma.achievement.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleAchievementUniqueError(error);
    }
  }

  async deleteAchievement(id: string) {
    const existing = await this.prisma.achievement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Conquista não encontrada');
    }
    await this.prisma.achievement.delete({ where: { id } });
    return { message: 'Conquista removida' };
  }

  private handleAchievementUniqueError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Já existe uma conquista com esta condição');
    }

    throw error;
  }
}
