import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CodeSubmissionMode,
  CodeSubmissionStatus,
  ProgrammingLanguage,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitAssignmentCodeDto } from './dto';

@Injectable()
export class CodeSubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRunnerStats() {
    const stuckThreshold = new Date(Date.now() - 5 * 60 * 1000);

    const [pending, running, stuckRunning, averageRuntime, recentInternalErrors, totalsByLanguage] =
      await Promise.all([
        this.prisma.codeSubmission.count({
          where: { status: CodeSubmissionStatus.PENDING },
        }),
        this.prisma.codeSubmission.count({
          where: { status: CodeSubmissionStatus.RUNNING },
        }),
        this.prisma.codeSubmission.count({
          where: {
            status: CodeSubmissionStatus.RUNNING,
            startedAt: { lt: stuckThreshold },
          },
        }),
        this.prisma.codeSubmission.aggregate({
          where: {
            judgedAt: { not: null },
            runtimeMs: { not: null },
          },
          _avg: { runtimeMs: true },
        }),
        this.prisma.codeSubmission.findMany({
          where: { status: CodeSubmissionStatus.INTERNAL_ERROR },
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            language: true,
            mode: true,
            errorMessage: true,
            createdAt: true,
            startedAt: true,
            judgedAt: true,
          },
        }),
        this.prisma.codeSubmission.groupBy({
          by: ['language'],
          _count: { _all: true },
        }),
      ]);

    return {
      pending,
      running,
      stuckRunning,
      averageRuntimeMs: Math.round(averageRuntime._avg.runtimeMs ?? 0),
      recentInternalErrors,
      totalsByLanguage: totalsByLanguage.reduce<Record<string, number>>((acc, item) => {
        acc[item.language] = item._count._all;
        return acc;
      }, {}),
    };
  }

  async runAssignmentExamples(userId: string, assignmentId: string, dto: SubmitAssignmentCodeDto) {
    const assignment = await this.getStudentAssignmentForSubmission(userId, assignmentId);

    this.ensureLanguageAllowed(
      assignment.problem.allowedLanguages as ProgrammingLanguage[],
      dto.language,
    );

    return this.prisma.codeSubmission.create({
      data: {
        userId,
        assignmentId,
        problemId: assignment.problemId,
        language: dto.language,
        code: dto.code,
        mode: CodeSubmissionMode.RUN,
        status: CodeSubmissionStatus.PENDING,
      },
    });
  }

  async submitAssignment(userId: string, assignmentId: string, dto: SubmitAssignmentCodeDto) {
    const assignment = await this.getStudentAssignmentForSubmission(userId, assignmentId);

    if (
      assignment.dueDate &&
      assignment.dueDate < new Date() &&
      !assignment.class.settings?.allowLateSubmissions
    ) {
      throw new BadRequestException('Prazo da atividade encerrado');
    }

    this.ensureLanguageAllowed(
      assignment.problem.allowedLanguages as ProgrammingLanguage[],
      dto.language,
    );

    return this.prisma.codeSubmission.create({
      data: {
        userId,
        assignmentId,
        problemId: assignment.problemId,
        language: dto.language,
        code: dto.code,
        mode: CodeSubmissionMode.SUBMIT,
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
        results: { include: { testCase: true } },
      },
    });
  }

  async findMyAssignmentSubmissions(userId: string, assignmentId: string) {
    await this.ensureStudentAssignmentAccess(userId, assignmentId);
    const submissions = await this.findByUser(userId, assignmentId);
    return submissions.map((submission) => this.sanitizeForStudent(submission));
  }

  async findByAssignment(assignmentId: string, userId: string, role: Role) {
    await this.ensureAssignmentManageAccess(assignmentId, userId, role);

    return this.prisma.codeSubmission.findMany({
      where: { assignmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        results: { include: { testCase: true } },
      },
    });
  }

  async findOne(id: string) {
    const submission = await this.prisma.codeSubmission.findUnique({
      where: { id },
      include: {
        results: { include: { testCase: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submissao de codigo nao encontrada');
    }

    return submission;
  }

  async findOneForUser(id: string, userId: string, role: Role) {
    const submission = await this.prisma.codeSubmission.findUnique({
      where: { id },
      include: {
        results: { include: { testCase: true } },
        assignment: {
          include: {
            class: { select: { createdById: true } },
          },
        },
        problem: {
          select: {
            createdById: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submissao de codigo nao encontrada');
    }

    if (role === Role.ADMIN) {
      return submission;
    }

    if (role === Role.PROFESSOR) {
      const ownsAssignment = submission.assignment?.class.createdById === userId;
      const ownsProblem = submission.problem.createdById === userId;
      if (ownsAssignment || ownsProblem) {
        return submission;
      }
      throw new ForbiddenException('Voce nao pode acessar esta submissao');
    }

    if (submission.userId !== userId) {
      throw new ForbiddenException('Voce nao pode acessar esta submissao');
    }

    return this.sanitizeForStudent(submission);
  }

  private ensureLanguageAllowed(
    allowedLanguages: ProgrammingLanguage[],
    language: ProgrammingLanguage,
  ) {
    if (!allowedLanguages.includes(language)) {
      throw new BadRequestException(`Linguagem ${language} nao aceita para este problema`);
    }
  }

  private async getStudentAssignmentForSubmission(userId: string, assignmentId: string) {
    const assignment = await this.prisma.programmingAssignment.findFirst({
      where: {
        id: assignmentId,
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
          select: {
            id: true,
            allowedLanguages: true,
          },
        },
        class: {
          select: {
            settings: {
              select: {
                allowLateSubmissions: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Atividade de programacao nao encontrada');
    }

    return assignment;
  }

  private async ensureStudentAssignmentAccess(userId: string, assignmentId: string) {
    const assignment = await this.prisma.programmingAssignment.findFirst({
      where: {
        id: assignmentId,
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

  private async ensureAssignmentManageAccess(assignmentId: string, userId: string, role: Role) {
    const assignment = await this.prisma.programmingAssignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        class: { select: { createdById: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Atividade de programacao nao encontrada');
    }

    if (role === Role.PROFESSOR && assignment.class.createdById !== userId) {
      throw new ForbiddenException('Voce nao pode acessar estas submissoes');
    }
  }

  private sanitizeForStudent<T extends { results?: any[] }>(submission: T) {
    return {
      ...submission,
      results: submission.results?.map((result) => {
        const visibility = result.testCase?.visibility ?? 'HIDDEN';
        if (visibility === 'PUBLIC') {
          return {
            id: result.id,
            status: result.status,
            visibility,
            input: result.inputPreview,
            expected: result.expected,
            actual: result.actual,
            errorMessage: result.errorMessage,
            runtimeMs: result.runtimeMs,
          };
        }

        return {
          id: result.id,
          status: result.status,
          visibility,
          runtimeMs: result.runtimeMs,
        };
      }),
    };
  }
}
