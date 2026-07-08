import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CodeSubmissionStatus, ProgrammingLanguage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCodeSubmissionDto } from './dto';

@Injectable()
export class CodeSubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCodeSubmissionDto) {
    const problem = await this.prisma.programmingProblem.findUnique({
      where: { id: dto.problemId },
      select: {
        id: true,
        allowedLanguages: true,
      },
    });

    if (!problem) {
      throw new NotFoundException('Problema de programacao nao encontrado');
    }

    this.ensureLanguageAllowed(
      problem.allowedLanguages as ProgrammingLanguage[],
      dto.language,
    );

    if (dto.assignmentId) {
      await this.ensureAssignmentMatchesProblem(dto.assignmentId, dto.problemId);
    }

    return this.prisma.codeSubmission.create({
      data: {
        userId,
        problemId: dto.problemId,
        assignmentId: dto.assignmentId,
        language: dto.language,
        code: dto.code,
        status: CodeSubmissionStatus.PENDING,
      },
    });
  }

  findByUser(userId: string, assignmentId?: string) {
    return this.prisma.codeSubmission.findMany({
      where: {
        userId,
        assignmentId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        results: true,
      },
    });
  }

  async findOne(id: string) {
    const submission = await this.prisma.codeSubmission.findUnique({
      where: { id },
      include: {
        results: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submissao de codigo nao encontrada');
    }

    return submission;
  }

  private ensureLanguageAllowed(
    allowedLanguages: ProgrammingLanguage[],
    language: ProgrammingLanguage,
  ) {
    if (!allowedLanguages.includes(language)) {
      throw new BadRequestException(
        `Linguagem ${language} nao aceita para este problema`,
      );
    }
  }

  private async ensureAssignmentMatchesProblem(
    assignmentId: string,
    problemId: string,
  ) {
    const assignment = await this.prisma.programmingAssignment.findUnique({
      where: { id: assignmentId },
      select: { problemId: true },
    });

    if (!assignment) {
      throw new NotFoundException('Atividade de programacao nao encontrada');
    }

    if (assignment.problemId !== problemId) {
      throw new BadRequestException(
        'A atividade informada nao pertence ao problema enviado',
      );
    }
  }
}

