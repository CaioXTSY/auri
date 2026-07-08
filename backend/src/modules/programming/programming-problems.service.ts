import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProgrammingLanguage, TestCaseVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProblemTestCaseDto,
  CreateProgrammingProblemDto,
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

  findAll() {
    return this.prisma.programmingProblem.findMany({
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
    });
  }

  async findOne(id: string) {
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

    return problem;
  }

  async update(id: string, dto: UpdateProgrammingProblemDto) {
    const current = await this.findOne(id);
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

  async createTestCase(problemId: string, dto: CreateProblemTestCaseDto) {
    await this.ensureProblemExists(problemId);

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

  findTestCases(problemId: string, includeHidden = false) {
    return this.prisma.problemTestCase.findMany({
      where: {
        problemId,
        ...(includeHidden ? {} : { visibility: TestCaseVisibility.PUBLIC }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateTestCase(id: string, dto: UpdateProblemTestCaseDto) {
    await this.ensureTestCaseExists(id);

    return this.prisma.problemTestCase.update({
      where: { id },
      data: dto,
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

