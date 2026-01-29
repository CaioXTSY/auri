import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class MissionsService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {}

  /**
   * Criar nova missão (Admin/Professor)
   */
  async create(createMissionDto: CreateMissionDto, createdById: string) {
    const { startDate, endDate, ...rest } = createMissionDto;

    // Validar datas
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('A data de início deve ser anterior à data de término');
    }

    // Criar missão
    return this.prisma.mission.create({
      data: {
        ...rest,
        startDate: start,
        endDate: end,
        createdById,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Listar todas as missões (com filtros)
   */
  async findAll(filters?: {
    classId?: string;
    disciplineId?: string;
    type?: 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA';
    active?: boolean;
  }) {
    const where: any = {};

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    // Filtrar apenas missões ativas (dentro do período)
    if (filters?.active) {
      const now = new Date();
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    return this.prisma.mission.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            disciplineId: true,
          },
        },
        userMissions: {
          select: {
            id: true,
            userId: true,
            status: true,
            progress: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Buscar missão por ID
   */
  async findOne(id: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            disciplineId: true,
          },
        },
        userMissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!mission) {
      throw new NotFoundException(`Missão com ID ${id} não encontrada`);
    }

    return mission;
  }

  /**
   * Atualizar missão
   */
  async update(id: string, updateMissionDto: UpdateMissionDto) {
    await this.findOne(id); // Verificar se existe

    const { startDate, endDate, ...rest } = updateMissionDto;
    const data: any = { ...rest };

    if (startDate) {
      data.startDate = new Date(startDate);
    }

    if (endDate) {
      data.endDate = new Date(endDate);
    }

    // Validar datas se ambas forem fornecidas
    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw new BadRequestException('A data de início deve ser anterior à data de término');
    }

    return this.prisma.mission.update({
      where: { id },
      data,
      include: {
        class: true,
      },
    });
  }

  /**
   * Deletar missão
   */
  async remove(id: string) {
    await this.findOne(id); // Verificar se existe

    return this.prisma.mission.delete({
      where: { id },
    });
  }

  /**
   * Listar missões disponíveis para um usuário
   */
  async getAvailableMissions(userId: string, classId?: string) {
    const now = new Date();

    // Buscar turmas do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        classEnrollments: {
          select: {
            classId: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const userClassIds = user.classEnrollments.map((e) => e.classId);

    const where: any = {
      OR: [
        { classId: null }, // Missões globais
        { classId: { in: userClassIds } }, // Missões das turmas do usuário
      ],
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (classId) {
      where.OR = [
        { classId: null },
        { classId },
      ];
    }

    const missions = await this.prisma.mission.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        userMissions: {
          where: {
            userId,
          },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    });

    // Mapear com status do usuário
    return missions.map((mission) => ({
      ...mission,
      userStatus: mission.userMissions[0] || null,
      userMissions: undefined, // Remover array completo
    }));
  }

  /**
   * Iniciar missão (usuário)
   */
  async startMission(missionId: string, userId: string) {
    const mission = await this.findOne(missionId);

    // Verificar se missão está ativa
    const now = new Date();
    if (now < mission.startDate || now > mission.endDate) {
      throw new BadRequestException('Esta missão não está mais disponível');
    }

    // Verificar se usuário já iniciou
    const existing = await this.prisma.userMission.findUnique({
      where: {
        userId_missionId: {
          userId,
          missionId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Você já iniciou esta missão');
    }

    // Criar UserMission
    return this.prisma.userMission.create({
      data: {
        userId,
        missionId,
        status: 'EM_PROGRESSO',
        progress: 0,
      },
      include: {
        mission: {
          include: {
            class: true,
          },
        },
      },
    });
  }

  /**
   * Atualizar progresso da missão
   */
  async updateProgress(missionId: string, userId: string, updateProgressDto: UpdateProgressDto) {
    const userMission = await this.prisma.userMission.findUnique({
      where: {
        userId_missionId: {
          userId,
          missionId,
        },
      },
      include: {
        mission: true,
      },
    });

    if (!userMission) {
      throw new NotFoundException('Você não iniciou esta missão');
    }

    if (userMission.status === 'CONCLUIDA') {
      throw new BadRequestException('Esta missão já foi concluída');
    }

    if (userMission.status === 'EXPIRADA') {
      throw new BadRequestException('Esta missão expirou');
    }

    // Se progresso chegou a 100%, completar automaticamente
    const data: any = {
      progress: updateProgressDto.progress,
    };

    if (updateProgressDto.progress >= 100) {
      data.status = 'CONCLUIDA';
      data.completedAt = new Date();

      // Adicionar pontos ao usuário
      await this.prisma.userPoint.create({
        data: {
          userId,
          points: userMission.mission.points,
          source: 'MISSAO',
          description: `Missão concluída: ${userMission.mission.title}`,
          referenceId: missionId,
        },
      });

      // Verificar conquistas de missão
      await this.gamificationService.checkMissionAchievements(userId);
    } else if (updateProgressDto.status) {
      data.status = updateProgressDto.status;
    }

    return this.prisma.userMission.update({
      where: {
        userId_missionId: {
          userId,
          missionId,
        },
      },
      data,
      include: {
        mission: true,
      },
    });
  }

  /**
   * Completar missão manualmente
   */
  async completeMission(missionId: string, userId: string) {
    return this.updateProgress(missionId, userId, {
      progress: 100,
      status: 'CONCLUIDA' as any,
    });
  }

  /**
   * Histórico de missões do usuário
   */
  async getUserMissionHistory(userId: string, filters?: {
    status?: 'NAO_INICIADA' | 'EM_PROGRESSO' | 'CONCLUIDA' | 'EXPIRADA';
    classId?: string;
  }) {
    const where: any = {
      userId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.classId) {
      where.mission = {
        classId: filters.classId,
      };
    }

    return this.prisma.userMission.findMany({
      where,
      include: {
        mission: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  /**
   * Estatísticas de missões do usuário
   */
  async getUserMissionStats(userId: string) {
    const [total, completed, inProgress, expired] = await Promise.all([
      this.prisma.userMission.count({ where: { userId } }),
      this.prisma.userMission.count({ where: { userId, status: 'CONCLUIDA' } }),
      this.prisma.userMission.count({ where: { userId, status: 'EM_PROGRESSO' } }),
      this.prisma.userMission.count({ where: { userId, status: 'EXPIRADA' } }),
    ]);

    const totalPoints = await this.prisma.userPoint.aggregate({
      where: {
        userId,
        source: 'MISSAO',
      },
      _sum: {
        points: true,
      },
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

  /**
   * CRON: Auto-reset de missões diárias (00:00 todos os dias)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyMissions() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Buscar missões diárias que expiraram
    const expiredMissions = await this.prisma.mission.findMany({
      where: {
        type: 'DIARIA',
        endDate: { lt: now },
      },
    });

    for (const mission of expiredMissions) {
      // Expirar missões em progresso
      await this.prisma.userMission.updateMany({
        where: {
          missionId: mission.id,
          status: 'EM_PROGRESSO',
        },
        data: {
          status: 'EXPIRADA',
        },
      });

      // Criar nova instância da missão diária
      await this.prisma.mission.create({
        data: {
          title: mission.title,
          description: mission.description,
          type: 'DIARIA',
          points: mission.points,
          startDate: startOfDay,
          endDate: endOfDay,
          classId: mission.classId,
          createdById: mission.createdById,
        },
      });
    }

    console.log(`[CRON] Reset de ${expiredMissions.length} missões diárias concluído`);
  }

  /**
   * CRON: Auto-reset de missões semanais (Domingo 00:00)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async resetWeeklyMissions() {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0);
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6, 23, 59, 59);

    // Buscar missões semanais que expiraram
    const expiredMissions = await this.prisma.mission.findMany({
      where: {
        type: 'SEMANAL',
        endDate: { lt: now },
      },
    });

    for (const mission of expiredMissions) {
      // Expirar missões em progresso
      await this.prisma.userMission.updateMany({
        where: {
          missionId: mission.id,
          status: 'EM_PROGRESSO',
        },
        data: {
          status: 'EXPIRADA',
        },
      });

      // Criar nova instância da missão semanal
      await this.prisma.mission.create({
        data: {
          title: mission.title,
          description: mission.description,
          type: 'SEMANAL',
          points: mission.points,
          startDate: startOfWeek,
          endDate: endOfWeek,
          classId: mission.classId,
          createdById: mission.createdById,
        },
      });
    }

    console.log(`[CRON] Reset de ${expiredMissions.length} missões semanais concluído`);
  }

  /**
   * CRON: Expirar missões automaticamente (a cada hora)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireMissions() {
    const now = new Date();

    // Buscar missões que expiraram
    const expiredMissions = await this.prisma.mission.findMany({
      where: {
        endDate: { lt: now },
      },
      select: {
        id: true,
      },
    });

    const missionIds = expiredMissions.map((m) => m.id);

    if (missionIds.length > 0) {
      // Marcar UserMissions como expiradas
      const result = await this.prisma.userMission.updateMany({
        where: {
          missionId: { in: missionIds },
          status: { in: ['NAO_INICIADA', 'EM_PROGRESSO'] },
        },
        data: {
          status: 'EXPIRADA',
        },
      });

      console.log(`[CRON] ${result.count} missões de usuários foram expiradas`);
    }
  }
}
