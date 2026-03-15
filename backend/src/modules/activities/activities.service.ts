import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateActivityDto,
  UpdateActivityDto,
  CreateTestCaseDto,
  QueryActivitiesDto,
  UpcomingActivityDto,
} from './dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createActivityDto: CreateActivityDto, userId: string) {
    if (createActivityDto.classId) {
      const classExists = await this.prisma.class.findUnique({
        where: { id: createActivityDto.classId },
        select: { id: true },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found');
      }
    }

    // Validar deadline não está no passado
    if (createActivityDto.deadline) {
      const deadlineDate = new Date(createActivityDto.deadline);
      if (deadlineDate < new Date()) {
        throw new BadRequestException('Deadline cannot be in the past');
      }
    }

    const { classId, deadline, ...rest } = createActivityDto;

    const data: Prisma.ActivityUncheckedCreateInput = {
      ...rest,
      classId,
      deadline: deadline ? new Date(deadline) : null,
      createdById: userId,
    };

    return this.prisma.activity.create({
      data,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            semester: true,
            year: true,
          },
        },
        _count: {
          select: {
            testCases: true,
            submissions: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryActivitiesDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.classId) {
      where.classId = query.classId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.title) {
      where.title = {
        contains: query.title,
        mode: 'insensitive',
      };
    }

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              semester: true,
              year: true,
            },
          },
          _count: {
            select: {
              testCases: true,
              submissions: true,
            },
          },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: activities,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findUpcomingForStudent(userId: string, limit = 3): Promise<UpcomingActivityDto[]> {
    const now = new Date();

    const enrollments = await this.prisma.classStudent.findMany({
      where: {
        userId: userId,
      },
      select: {
        classId: true,
      },
    });

    const classIds = enrollments.map((e) => e.classId);

    if (classIds.length === 0) {
      return [];
    }

    const activities = await this.prisma.activity.findMany({
      where: {
        classId: { in: classIds },
        status: 'ATIVA',
        deadline: {
          gt: now,
        },
      },
      orderBy: {
        deadline: 'asc',
      },
      take: limit,
      select: {
        id: true,
        title: true,
        deadline: true,
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    return activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      deadline: activity.deadline!,
      className: activity.class?.name || 'Turma',
      status: 'PENDENTE',
    }));
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            semester: true,
            year: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        testCases: {
          select: {
            id: true,
            input: true,
            expectedOutput: true,
            points: true,
            isVisible: true,
            description: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Se alterando turma, validar se existe
    if (updateActivityDto.classId && updateActivityDto.classId !== activity.classId) {
      const classExists = await this.prisma.class.findUnique({
        where: { id: updateActivityDto.classId },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found');
      }
    }

    // Validar deadline não está no passado
    if (updateActivityDto.deadline) {
      const deadlineDate = new Date(updateActivityDto.deadline);
      if (deadlineDate < new Date()) {
        throw new BadRequestException('Deadline cannot be in the past');
      }
    }

    const { classId, deadline, ...rest } = updateActivityDto;

    const data: Prisma.ActivityUncheckedUpdateInput = {
      ...rest,
      ...(classId !== undefined ? { classId } : {}),
      ...(deadline !== undefined
        ? {
            deadline: deadline ? new Date(deadline) : null,
          }
        : {}),
    };

    return this.prisma.activity.update({
      where: { id },
      data,
      include: {
        class: true,
        _count: {
          select: {
            testCases: true,
            submissions: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Não permite remover se houver submissões
    if (activity._count.submissions > 0) {
      throw new BadRequestException(
        'Cannot delete activity with submissions',
      );
    }

    await this.prisma.activity.delete({
      where: { id },
    });

    return { message: 'Activity successfully deleted' };
  }

  // ==================== TEST CASES ====================

  async createTestCase(activityId: string, createTestCaseDto: CreateTestCaseDto) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.testCase.create({
      data: {
        ...createTestCaseDto,
        activityId,
      },
    });
  }

  async findTestCases(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.testCase.findMany({
      where: { activityId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async removeTestCase(activityId: string, testCaseId: string) {
    const testCase = await this.prisma.testCase.findFirst({
      where: {
        id: testCaseId,
        activityId,
      },
    });

    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }

    await this.prisma.testCase.delete({
      where: { id: testCaseId },
    });

    return { message: 'Test case successfully deleted' };
  }
}
