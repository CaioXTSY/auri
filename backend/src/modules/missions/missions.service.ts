import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { AnswerQuizDto } from './dto/answer-quiz.dto';
import { MissionType } from '@prisma/client';
import { MissionQuizService } from './mission-quiz.service';

@Injectable()
export class MissionsService {
  constructor(
    private prisma: PrismaService,
    private missionQuizService: MissionQuizService,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────

  async create(createMissionDto: CreateMissionDto, createdById: string) {
    const { startDate, endDate, ...rest } = createMissionDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('A data de início deve ser anterior à data de término');
    }

    if (createMissionDto.classId) {
      const classExists = await this.prisma.class.findUnique({
        where: { id: createMissionDto.classId },
        select: { id: true },
      });
      if (!classExists) {
        throw new BadRequestException('Turma não encontrada');
      }
    }

    if (createMissionDto.type === 'DIARIA') {
      const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
      const endOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59);
      const existing = await this.prisma.mission.findFirst({
        where: {
          type: 'DIARIA',
          startDate: { gte: startOfDay },
          endDate: { lte: endOfDay },
        },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('Já existe uma missão diária para este dia');
      }
    }

    return this.prisma.mission.create({
      data: {
        ...rest,
        startDate: start,
        endDate: end,
        createdById,
      },
      include: {
        class: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(filters?: {
    classId?: string;
    type?: MissionType;
    active?: boolean;
  }) {
    const where: any = {};

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.active) {
      const now = new Date();
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    return this.prisma.mission.findMany({
      where,
      include: {
        class: { select: { id: true, name: true } },
        userMissions: {
          select: { id: true, userId: true, status: true, progress: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true } },
        userMissions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!mission) {
      throw new NotFoundException(`Missão com ID ${id} não encontrada`);
    }

    return mission;
  }

  async update(id: string, updateMissionDto: UpdateMissionDto) {
    await this.findOne(id);

    const { startDate, endDate, ...rest } = updateMissionDto;
    const data: any = { ...rest };

    if (startDate) {
      data.startDate = new Date(startDate);
    }

    if (endDate) {
      data.endDate = new Date(endDate);
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw new BadRequestException('A data de início deve ser anterior à data de término');
    }

    return this.prisma.mission.update({
      where: { id },
      data,
      include: { class: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.mission.delete({ where: { id } });
  }

  // ─── Queries de usuário ──────────────────────────────────

  async getAvailableMissions(userId?: string, classId?: string) {
    const now = new Date();

    if (!userId) {
      const missions = await this.prisma.mission.findMany({
        where: {
          classId: null,
          startDate: { lte: now },
          endDate: { gte: now },
          ...(classId ? { classId } : {}),
        },
        include: {
          class: { select: { id: true, name: true } },
        },
        orderBy: { endDate: 'asc' },
      });

      return missions.map((mission) => ({
        ...mission,
        userStatus: null,
      }));
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        classEnrollments: { select: { classId: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const userClassIds = user.classEnrollments.map((e) => e.classId);

    const visibilityScope = classId
      ? [{ classId: null }, { classId }]
      : [{ classId: null }, { classId: { in: userClassIds } }];

    const where: any = {
      OR: [
        {
          AND: [
            { OR: visibilityScope },
            { startDate: { lte: now } },
            { endDate: { gte: now } },
          ],
        },
        {
          AND: [
            { OR: visibilityScope },
            { type: MissionType.DIARIA },
            { quiz: { isNot: null } },
            {
              quizAttempts: {
                none: { userId },
              },
            },
          ],
        },
      ],
    };

    const missions = await this.prisma.mission.findMany({
      where,
      include: {
        class: { select: { id: true, name: true } },
        userMissions: { where: { userId } },
      },
      orderBy: { endDate: 'asc' },
    });

    return missions.map((mission) => ({
      ...mission,
      userStatus: mission.userMissions[0] || null,
      userMissions: undefined,
    }));
  }

  async getUserMissionHistory(userId: string, filters?: {
    status?: 'NAO_INICIADA' | 'EM_PROGRESSO' | 'CONCLUIDA' | 'EXPIRADA';
    classId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.classId) {
      where.mission = { classId: filters.classId };
    }

    const [data, total] = await Promise.all([
      this.prisma.userMission.findMany({
        where,
        include: {
          mission: {
            include: {
              class: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userMission.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getUserMissionStats(userId: string) {
    const [total, completed, inProgress, expired] = await Promise.all([
      this.prisma.userMission.count({ where: { userId } }),
      this.prisma.userMission.count({ where: { userId, status: 'CONCLUIDA' } }),
      this.prisma.userMission.count({ where: { userId, status: 'EM_PROGRESSO' } }),
      this.prisma.userMission.count({ where: { userId, status: 'EXPIRADA' } }),
    ]);

    const totalPoints = await this.prisma.userPoint.aggregate({
      where: { userId, source: 'MISSAO' },
      _sum: { points: true },
    });

    return {
      total,
      completed,
      inProgress,
      expired,
      totalPoints: totalPoints._sum.points || 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  // ─── Delegações para MissionQuizService ──────────────────

  startMission(missionId: string, userId: string) {
    return this.missionQuizService.startMission(missionId, userId);
  }

  getMissionQuiz(missionId: string, userId: string) {
    return this.missionQuizService.getMissionQuiz(missionId, userId);
  }

  answerMissionQuiz(missionId: string, userId: string, answerQuizDto: AnswerQuizDto) {
    return this.missionQuizService.answerMissionQuiz(missionId, userId, answerQuizDto);
  }

  getDailyQuiz() {
    return this.missionQuizService.getDailyQuiz();
  }

  getDailyQuizForUser(userId: string) {
    return this.missionQuizService.getDailyQuizForUser(userId);
  }

  completeMission(missionId: string, userId: string) {
    return this.missionQuizService.completeMission(missionId, userId);
  }
}
