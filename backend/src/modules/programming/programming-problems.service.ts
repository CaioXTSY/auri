import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProgrammingLanguage,
  Role,
  TestCaseVisibility,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProblemTestCaseDto,
  CreateProgrammingProblemDto,
  QueryProgrammingListDto,
  UpdateProblemTestCaseDto,
  UpdateProgrammingProblemDto,
} from './dto';

@Injectable()
export class ProgrammingProblemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createdById: string, dto: CreateProgrammingProblemDto) {
    this.validateStarterCode(dto.allowedLanguages, dto.starterCode);

    return this.prisma.programmingProblem.create({
      data: {
        title: dto.title,
        statement: dto.statement,
        difficulty: dto.difficulty,
        allowedLanguages: dto.allowedLanguages as Prisma.InputJsonValue,
        starterCode: dto.starterCode as Prisma.InputJsonValue,
        timeLimitMs: dto.timeLimitMs,
        memoryLimitMb: dto.memoryLimitMb,
        createdById,
      },
    });
  }

  async findAll(
    userId: string,
    role: Role,
    query: QueryProgrammingListDto = {},
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.ProgrammingProblemWhereInput =
      role === Role.PROFESSOR ? { createdById: userId } : {};

    const [data, total] = await Promise.all([
      this.prisma.programmingProblem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              testCases: true,
              assignments: true,
              submissions: true,
            },
          },
        },
      }),
      this.prisma.programmingProblem.count({ where }),
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
    const problem = await this.prisma.programmingProblem.findUnique({
      where: { id },
      include: {
        testCases: true,
        assignments: true,
      },
    });

    if (!problem) {
      throw new NotFoundException('Problema de programacao nao encontrado');
    }

    if (role === Role.PROFESSOR && problem.createdById !== userId) {
      throw new ForbiddenException('Voce nao pode acessar este problema');
    }

    return problem;
  }

  async update(
    id: string,
    dto: UpdateProgrammingProblemDto,
    userId: string,
    role: Role,
  ) {
    const current = await this.findOne(id, userId, role);
    const allowedLanguages =
      dto.allowedLanguages ??
      (current.allowedLanguages as ProgrammingLanguage[]);
    const starterCode =
      dto.starterCode ??
      (current.starterCode as Record<ProgrammingLanguage, string>);

    this.validateStarterCode(allowedLanguages, starterCode);

    return this.prisma.programmingProblem.update({
      where: { id },
      data: {
        title: dto.title,
        statement: dto.statement,
        difficulty: dto.difficulty,
        allowedLanguages: dto.allowedLanguages as Prisma.InputJsonValue,
        starterCode: dto.starterCode as Prisma.InputJsonValue,
        timeLimitMs: dto.timeLimitMs,
        memoryLimitMb: dto.memoryLimitMb,
      },
    });
  }

  async remove(id: string, userId: string, role: Role) {
    await this.findOne(id, userId, role);

    return this.prisma.programmingProblem.delete({
      where: { id },
    });
  }

  async createTestCase(
    problemId: string,
    dto: CreateProblemTestCaseDto,
    userId: string,
    role: Role,
  ) {
    await this.ensureProblemAccess(problemId, userId, role);

    return this.prisma.problemTestCase.create({
      data: {
        problemId,
        input: dto.input,
        expected: dto.expected,
        visibility: dto.visibility,
        weight: dto.weight,
      },
    });
  }

  async findTestCases(
    problemId: string,
    includeHidden = false,
    userId?: string,
    role?: Role,
  ) {
    if (includeHidden && userId && role) {
      await this.ensureProblemAccess(problemId, userId, role);
    } else {
      await this.ensureProblemExists(problemId);
    }

    return this.prisma.problemTestCase.findMany({
      where: {
        problemId,
        ...(includeHidden ? {} : { visibility: TestCaseVisibility.PUBLIC }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateTestCase(
    id: string,
    dto: UpdateProblemTestCaseDto,
    userId: string,
    role: Role,
  ) {
    await this.ensureTestCaseAccess(id, userId, role);

    return this.prisma.problemTestCase.update({
      where: { id },
      data: dto,
    });
  }

  async removeTestCase(id: string, userId: string, role: Role) {
    await this.ensureTestCaseAccess(id, userId, role);

    return this.prisma.problemTestCase.delete({
      where: { id },
    });
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

  private async ensureTestCaseExists(id: string) {
    const exists = await this.prisma.problemTestCase.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Caso de teste nao encontrado');
    }
  }

  private async ensureProblemAccess(id: string, userId: string, role: Role) {
    const problem = await this.prisma.programmingProblem.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });

    if (!problem) {
      throw new NotFoundException('Problema de programacao nao encontrado');
    }

    if (role === Role.PROFESSOR && problem.createdById !== userId) {
      throw new ForbiddenException('Voce nao pode gerenciar este problema');
    }
  }

  private async ensureTestCaseAccess(id: string, userId: string, role: Role) {
    const testCase = await this.prisma.problemTestCase.findUnique({
      where: { id },
      select: {
        id: true,
        problem: { select: { createdById: true } },
      },
    });

    if (!testCase) {
      throw new NotFoundException('Caso de teste nao encontrado');
    }

    if (role === Role.PROFESSOR && testCase.problem.createdById !== userId) {
      throw new ForbiddenException('Voce nao pode gerenciar este caso de teste');
    }
  }

  private validateStarterCode(
    allowedLanguages: ProgrammingLanguage[],
    starterCode: Record<ProgrammingLanguage, string>,
  ) {
    for (const language of allowedLanguages) {
      if (!starterCode?.[language]?.trim()) {
        throw new BadRequestException(
          `Starter code obrigatorio para ${language}`,
        );
      }
    }
  }
}
