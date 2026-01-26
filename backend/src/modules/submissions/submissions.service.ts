import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  QuerySubmissionsDto,
} from './dto';
import { SubmissionStatus } from '@prisma/client';
import { Judge0Service } from './judge0.service';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly judge0Service: Judge0Service,
  ) {}

  /**
   * Criar nova submissão
   * - Valida se a atividade existe
   * - Valida se o usuário está matriculado na turma (se a atividade tiver turma)
   * - Valida se a atividade aceita submissões atrasadas (se passou do deadline)
   * - Cria a submissão com status PENDENTE
   */
  async create(createSubmissionDto: CreateSubmissionDto, userId: string) {
    const { activityId, code, language } = createSubmissionDto;

    // Validar se a atividade existe
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        class: true,
        testCases: true,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Validar se a atividade está ativa
    if (activity.status !== 'ATIVA') {
      throw new BadRequestException('Activity is not active');
    }

    // Se a atividade pertence a uma turma, validar matrícula
    if (activity.classId) {
      const enrollment = await this.prisma.classStudent.findUnique({
        where: {
          classId_userId: {
            classId: activity.classId,
            userId: userId,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You are not enrolled in the class for this activity',
        );
      }
    }

    // Validar deadline
    if (activity.deadline) {
      const now = new Date();
      const deadline = new Date(activity.deadline);

      if (now > deadline && !activity.allowLateSubmission) {
        throw new BadRequestException(
          'Submission deadline has passed and late submissions are not allowed',
        );
      }
    }

    // Criar submissão
    const submission = await this.prisma.submission.create({
      data: {
        activityId,
        userId,
        code,
        language,
        status: SubmissionStatus.PENDENTE,
      },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            points: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return submission;
  }

  /**
   * Listar submissões com paginação e filtros
   * - Alunos veem apenas suas próprias submissões
   * - Professores e Admin veem todas
   */
  async findAll(query: QuerySubmissionsDto, userId: string, userRole: string) {
    const {
      page = 1,
      limit = 10,
      activityId,
      userId: filterUserId,
      status,
      sortBy = 'submittedAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    // Alunos só veem suas submissões
    if (userRole === 'ALUNO') {
      where.userId = userId;
    }

    // Filtro por usuário (apenas Admin/Professor podem filtrar por outro usuário)
    if (filterUserId && userRole !== 'ALUNO') {
      where.userId = filterUserId;
    }

    if (activityId) {
      where.activityId = activityId;
    }

    if (status) {
      where.status = status;
    }

    // Buscar submissões
    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              points: true,
              discipline: {
                select: {
                  id: true,
                  name: true,
                  language: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.submission.count({ where }),
    ]);

    return {
      data: submissions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar submissão por ID
   * - Alunos só podem ver suas próprias submissões
   * - Professores e Admin podem ver todas
   */
  async findOne(id: string, userId: string, userRole: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        activity: {
          include: {
            discipline: true,
            class: true,
            testCases: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Validar permissão
    if (userRole === 'ALUNO' && submission.userId !== userId) {
      throw new ForbiddenException('You can only view your own submissions');
    }

    return submission;
  }

  /**
   * Atualizar submissão
   * - Apenas Admin pode atualizar manualmente
   * - Usado para atualizar resultado da execução, pontos, etc.
   */
  async update(id: string, updateSubmissionDto: UpdateSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const updated = await this.prisma.submission.update({
      where: { id },
      data: updateSubmissionDto,
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            points: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Remover submissão
   * - Alunos podem deletar apenas suas próprias submissões
   * - Admin pode deletar qualquer submissão
   */
  async remove(id: string, userId: string, userRole: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Validar permissão
    if (userRole === 'ALUNO' && submission.userId !== userId) {
      throw new ForbiddenException('You can only delete your own submissions');
    }

    await this.prisma.submission.delete({
      where: { id },
    });

    return { message: 'Submission successfully deleted' };
  }

  /**
   * Executar submissão usando Judge0
   * - Muda status para EXECUTANDO
   * - Executa código contra casos de teste reais
   * - Atualiza resultado e pontos baseado nos testes
   */
  async execute(id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        activity: {
          include: {
            testCases: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.status !== SubmissionStatus.PENDENTE) {
      throw new BadRequestException(
        'Only pending submissions can be executed',
      );
    }

    // Verificar se há casos de teste
    const testCases = submission.activity.testCases;
    if (testCases.length === 0) {
      throw new BadRequestException(
        'Activity has no test cases configured',
      );
    }

    // Atualizar status para EXECUTANDO
    await this.prisma.submission.update({
      where: { id },
      data: { status: SubmissionStatus.EXECUTANDO },
    });

    try {
      this.logger.log(
        `Executando submissão ${id} com ${testCases.length} casos de teste`,
      );

      // Preparar casos de teste para Judge0
      const judge0TestCases = testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }));

      // Executar contra Judge0
      const results = await this.judge0Service.executeAgainstTestCases(
        submission.code,
        submission.language,
        judge0TestCases,
        submission.activity.timeLimit || 2,
        submission.activity.memoryLimit || 128000,
      );

      // Calcular resultados
      const totalTests = results.length;
      const passedTests = results.filter((r) => r.passed).length;
      const pointsPerTest =
        totalTests > 0 ? submission.activity.points / totalTests : 0;
      const pointsEarned = Math.round(passedTests * pointsPerTest);

      // Calcular tempo e memória médios
      const avgTime =
        results.reduce((sum, r) => sum + (r.time || 0), 0) / totalTests;
      const maxMemory = Math.max(...results.map((r) => r.memory || 0));

      // Determinar status final
      let status: SubmissionStatus;
      let result: string;

      if (passedTests === totalTests) {
        status = SubmissionStatus.APROVADO;
        result = `✅ Todos os ${totalTests} casos de teste passaram!\n\n`;
      } else if (passedTests > 0) {
        status = SubmissionStatus.PARCIAL;
        result = `⚠️ ${passedTests}/${totalTests} casos de teste passaram\n\n`;
      } else {
        status = SubmissionStatus.REPROVADO;
        result = `❌ Nenhum caso de teste passou\n\n`;
      }

      // Adicionar detalhes de cada caso de teste
      result += '📊 Detalhes dos Testes:\n\n';
      results.forEach((r, index) => {
        const icon = r.passed ? '✅' : '❌';
        result += `${icon} Teste ${index + 1}: ${r.status}\n`;
        if (!r.passed) {
          result += `   Entrada: ${r.input}\n`;
          result += `   Esperado: ${r.expectedOutput}\n`;
          result += `   Obtido: ${r.actualOutput || 'N/A'}\n`;
          if (r.error) {
            result += `   Erro: ${r.error}\n`;
          }
        }
        if (r.time) {
          result += `   Tempo: ${r.time.toFixed(0)}ms\n`;
        }
        result += '\n';
      });

      // Atualizar submissão com resultado
      const updated = await this.prisma.submission.update({
        where: { id },
        data: {
          status,
          result,
          pointsEarned,
          executionTime: Math.round(avgTime),
          memoryUsed: Math.round(maxMemory),
        },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              points: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(
        `Submissão ${id} executada: ${passedTests}/${totalTests} testes passaram`,
      );

      return updated;
    } catch (error) {
      this.logger.error(
        `Erro ao executar submissão ${id}: ${error.message}`,
        error.stack,
      );

      // Em caso de erro, marcar como ERRO
      await this.prisma.submission.update({
        where: { id },
        data: {
          status: SubmissionStatus.ERRO,
          result: `❌ Erro na execução:\n\n${error.message}\n\nVerifique se:\n- O Judge0 está rodando\n- Seu código não tem erros de sintaxe\n- A linguagem é suportada`,
        },
      });

      throw new BadRequestException(
        `Falha na execução: ${error.message}`,
      );
    }
  }

  /**
   * Obter estatísticas de submissões de um usuário
   */
  async getUserStats(userId: string) {
    const [
      totalSubmissions,
      approved,
      partial,
      rejected,
      totalPoints,
    ] = await Promise.all([
      this.prisma.submission.count({ where: { userId } }),
      this.prisma.submission.count({
        where: { userId, status: SubmissionStatus.APROVADO },
      }),
      this.prisma.submission.count({
        where: { userId, status: SubmissionStatus.PARCIAL },
      }),
      this.prisma.submission.count({
        where: { userId, status: SubmissionStatus.REPROVADO },
      }),
      this.prisma.submission.aggregate({
        where: { userId },
        _sum: { pointsEarned: true },
      }),
    ]);

    return {
      totalSubmissions,
      approved,
      partial,
      rejected,
      pending: totalSubmissions - approved - partial - rejected,
      totalPoints: totalPoints._sum.pointsEarned || 0,
      approvalRate:
        totalSubmissions > 0
          ? ((approved / totalSubmissions) * 100).toFixed(2)
          : 0,
    };
  }

  /**
   * Obter submissões de uma atividade específica
   */
  async getActivitySubmissions(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const submissions = await this.prisma.submission.findMany({
      where: { activityId },
      orderBy: { submittedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const stats = {
      total: submissions.length,
      approved: submissions.filter((s) => s.status === SubmissionStatus.APROVADO)
        .length,
      partial: submissions.filter((s) => s.status === SubmissionStatus.PARCIAL)
        .length,
      rejected: submissions.filter((s) => s.status === SubmissionStatus.REPROVADO)
        .length,
      pending: submissions.filter((s) => s.status === SubmissionStatus.PENDENTE)
        .length,
    };

    return {
      submissions,
      stats,
    };
  }
}
