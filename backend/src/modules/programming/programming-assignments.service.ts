import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, TestCaseVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProgrammingAssignmentDto,
  QueryProgrammingListDto,
  UpdateProgrammingAssignmentDto,
} from './dto';

@Injectable()
export class ProgrammingAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProgrammingAssignmentDto, userId: string, role: Role) {
    await this.ensureProblemExists(dto.problemId);
    await this.ensureClassManageAccess(dto.classId, userId, role);

    if (dto.published) {
      await this.ensureProblemCanBePublished(dto.problemId);
    }

    return this.prisma.programmingAssignment.create({
      data: {
        problemId: dto.problemId,
        classId: dto.classId,
        title: dto.title,
        points: dto.points,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        published: dto.published,
      },
    });
  }

  async findAll(userId: string, role: Role, query: QueryProgrammingListDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where =
      role === Role.PROFESSOR
        ? {
            class: { createdById: userId },
          }
        : {};

    const [data, total] = await Promise.all([
      this.prisma.programmingAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          problem: true,
          class: true,
          _count: { select: { submissions: true } },
        },
      }),
      this.prisma.programmingAssignment.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string, role?: Role) {
    const assignment = await this.prisma.programmingAssignment.findUnique({
      where: { id },
      include: {
        problem: true,
        class: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Atividade de programacao nao encontrada');
    }

    if (role === Role.PROFESSOR && assignment.class.createdById !== userId) {
      throw new ForbiddenException('Voce nao pode acessar esta atividade');
    }

    return assignment;
  }

  async update(id: string, dto: UpdateProgrammingAssignmentDto, userId: string, role: Role) {
    const current = await this.findOne(id, userId, role);
    const problemId = dto.problemId ?? current.problemId;

    if (dto.problemId) {
      await this.ensureProblemExists(dto.problemId);
    }

    if (dto.classId) {
      await this.ensureClassManageAccess(dto.classId, userId, role);
    }

    if (dto.published) {
      await this.ensureProblemCanBePublished(problemId);
    }

    return this.prisma.programmingAssignment.update({
      where: { id },
      data: {
        problemId: dto.problemId,
        classId: dto.classId,
        title: dto.title,
        points: dto.points,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        published: dto.published,
      },
    });
  }

  async remove(id: string, userId: string, role: Role) {
    await this.findOne(id, userId, role);

    return this.prisma.programmingAssignment.delete({
      where: { id },
    });
  }

  findMyAssignments(userId: string) {
    return this.prisma.programmingAssignment.findMany({
      where: {
        published: true,
        class: {
          settings: {
            is: { activitiesEnabled: true },
          },
          students: {
            some: { userId },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            statement: true,
            difficulty: true,
            allowedLanguages: true,
            timeLimitMs: true,
            memoryLimitMb: true,
          },
        },
        class: true,
        submissions: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            score: true,
            passedTests: true,
            totalTests: true,
            createdAt: true,
            judgedAt: true,
          },
        },
      },
    });
  }

  async getSolveView(id: string, userId: string) {
    const assignment = await this.prisma.programmingAssignment.findFirst({
      where: {
        id,
        published: true,
        class: {
          settings: {
            is: { activitiesEnabled: true },
          },
          students: {
            some: { userId },
          },
        },
      },
      include: {
        problem: {
          include: {
            testCases: {
              where: { visibility: TestCaseVisibility.PUBLIC },
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                input: true,
                expected: true,
                visibility: true,
                weight: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Atividade de programacao nao encontrada');
    }

    return assignment;
  }

  async ensureStudentCanAccessAssignment(id: string, userId: string) {
    const assignment = await this.prisma.programmingAssignment.findFirst({
      where: {
        id,
        published: true,
        class: {
          settings: {
            is: { activitiesEnabled: true },
          },
          students: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    });

    if (!assignment) {
      throw new NotFoundException('Atividade de programacao nao encontrada');
    }
  }

  private async ensureProblemExists(id: string) {
    const exists = await this.prisma.programmingProblem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Problema de programacao nao encontrado');
    }
  }

  private async ensureClassExists(id: string) {
    const exists = await this.prisma.class.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Turma nao encontrada');
    }
  }

  private async ensureClassManageAccess(id: string, userId: string, role: Role) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma nao encontrada');
    }

    if (role === Role.PROFESSOR && classEntity.createdById !== userId) {
      throw new ForbiddenException('Voce nao pode gerenciar esta turma');
    }
  }

  private async ensureProblemCanBePublished(problemId: string) {
    const testCasesCount = await this.prisma.problemTestCase.count({
      where: { problemId },
    });

    if (testCasesCount === 0) {
      throw new BadRequestException('Nao e possivel publicar atividade sem casos de teste');
    }
  }
}
