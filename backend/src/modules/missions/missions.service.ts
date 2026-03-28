import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { AnswerQuizDto } from './dto/answer-quiz.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GamificationService } from '../gamification/gamification.service';
import { ConfigService } from '@nestjs/config';
import { Difficulty, MissionType, MissionStatus } from '@prisma/client';

@Injectable()
export class MissionsService {
  private dailyQuizGenerationLock = false;

  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
    private configService: ConfigService,
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

    if (createMissionDto.classId) {
      const classExists = await this.prisma.class.findUnique({
        where: { id: createMissionDto.classId },
        select: { id: true },
      });
      if (!classExists) {
        throw new BadRequestException('Turma não encontrada');
      }
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
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          endDate: 'asc',
        },
      });

      return missions.map((mission) => ({
        ...mission,
        userStatus: null,
      }));
    }

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

    const visibilityScope = classId
      ? [
          { classId: null },
          { classId },
        ]
      : [
          { classId: null }, // Missões globais
          { classId: { in: userClassIds } }, // Missões das turmas do usuário
        ];

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
                none: {
                  userId,
                },
              },
            },
          ],
        },
      ],
    };

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

    // Verificar matrícula na turma (missões globais não exigem)
    if (mission.classId) {
      const enrolled = await this.prisma.classStudent.findUnique({
        where: { classId_userId: { classId: mission.classId, userId } },
      });
      if (!enrolled) {
        throw new ForbiddenException('Você não está matriculado na turma desta missão');
      }
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
        status: MissionStatus.EM_PROGRESSO,
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

    if (userMission.status === MissionStatus.CONCLUIDA) {
      throw new BadRequestException('Esta missão já foi concluída');
    }

    if (userMission.status === MissionStatus.EXPIRADA) {
      throw new BadRequestException('Esta missão expirou');
    }

    // Se progresso chegou a 100%, completar automaticamente
    const data: any = {
      progress: updateProgressDto.progress,
    };

    if (updateProgressDto.progress >= 100) {
      data.status = MissionStatus.CONCLUIDA;
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

  async getMissionQuiz(missionId: string, userId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { quiz: true },
    });

    if (!mission || !mission.quiz) {
      throw new NotFoundException('Quiz da missão não encontrado');
    }

    const now = new Date();
    if (mission.type !== MissionType.DIARIA && (now < mission.startDate || now > mission.endDate)) {
      throw new BadRequestException('Esta missão não está mais disponível');
    }

    // Verificar matrícula na turma (missões globais não exigem)
    if (mission.classId) {
      const enrolled = await this.prisma.classStudent.findUnique({
        where: { classId_userId: { classId: mission.classId, userId } },
      });
      if (!enrolled) {
        throw new ForbiddenException('Você não está matriculado na turma desta missão');
      }
    }

    const attempt = await this.prisma.missionQuizAttempt.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });

    return {
      missionId: mission.id,
      title: mission.quiz.title,
      question: mission.quiz.question,
      difficulty: mission.quiz.difficulty,
      points: mission.points,
      options: mission.quiz.options,
      answered: !!attempt,
      attempt: attempt
        ? { selectedIndex: attempt.selectedIndex, isCorrect: attempt.isCorrect, answeredAt: attempt.answeredAt }
        : null,
    };
  }

  async answerMissionQuiz(missionId: string, userId: string, answerQuizDto: AnswerQuizDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
    }

    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        quiz: true,
      },
    });

    if (!mission || !mission.quiz) {
      throw new NotFoundException('Quiz da missão não encontrado');
    }

    const now = new Date();
    if (mission.type !== MissionType.DIARIA && (now < mission.startDate || now > mission.endDate)) {
      throw new BadRequestException('Esta missão não está mais disponível');
    }

    const options = Array.isArray(mission.quiz.options) ? mission.quiz.options : [];
    if (answerQuizDto.selectedIndex < 0 || answerQuizDto.selectedIndex >= options.length) {
      throw new BadRequestException('Alternativa inválida');
    }

    const isCorrect = answerQuizDto.selectedIndex === mission.quiz.correctIndex;

    await this.prisma.$transaction(async (tx) => {
      const existingAttempt = await tx.missionQuizAttempt.findUnique({
        where: { userId_missionId: { userId, missionId } },
      });

      // Bloqueia apenas quem já acertou — quem errou pode tentar de novo
      if (existingAttempt?.isCorrect) {
        throw new BadRequestException('Você já respondeu corretamente este quiz');
      }

      const userMission = await tx.userMission.findUnique({
        where: { userId_missionId: { userId, missionId } },
      });

      if (!userMission) {
        await tx.userMission.create({
          data: {
            userId,
            missionId,
            status: MissionStatus.EM_PROGRESSO,
            progress: 0,
          },
        });
      }

      // Upsert: cria na primeira tentativa, atualiza nas seguintes
      await tx.missionQuizAttempt.upsert({
        where: { userId_missionId: { userId, missionId } },
        create: {
          userId,
          missionId,
          missionQuizId: mission.quiz.id,
          selectedIndex: answerQuizDto.selectedIndex,
          isCorrect,
        },
        update: {
          selectedIndex: answerQuizDto.selectedIndex,
          isCorrect,
          answeredAt: new Date(),
        },
      });

      if (isCorrect) {
        // Missão concluída somente ao acertar
        await tx.userMission.update({
          where: { userId_missionId: { userId, missionId } },
          data: {
            status: MissionStatus.CONCLUIDA,
            progress: 100,
            completedAt: new Date(),
          },
        });

        // Pontos apenas na primeira resposta correta (existingAttempt era nulo ou errado)
        await tx.userPoint.create({
          data: {
            userId,
            points: mission.points,
            source: 'MISSAO',
            description: `Quiz concluído: ${mission.title}`,
            referenceId: missionId,
          },
        });
      }
    });

    // Verificar conquistas fora da transaction (são side-effects, não precisam ser atômicos)
    await this.gamificationService.checkMissionAchievements(userId);
    await this.gamificationService.checkQuizAchievements(userId);

    return {
      isCorrect,
      correctIndex: mission.quiz.correctIndex,
      explanations: mission.quiz.explanations,
      selectedIndex: answerQuizDto.selectedIndex,
      difficulty: mission.quiz.difficulty,
      pointsAwarded: isCorrect ? mission.points : 0,
    };
  }

  async getDailyQuiz() {
    let mission = await this.getTodayDailyQuizMission();

    if (!mission || !mission.quiz) {
      const generated = await this.generateDailyQuizMission();
      if (generated) {
        return generated;
      }

      mission = await this.getTodayDailyQuizMission();
    }

    if (!mission || !mission.quiz) {
      throw new NotFoundException('Quiz diário não encontrado');
    }

    return {
      missionId: mission.id,
      title: mission.quiz.title,
      question: mission.quiz.question,
      difficulty: mission.quiz.difficulty,
      points: mission.points,
      options: mission.quiz.options,
      answered: false,
      attempt: null,
    };
  }

  async getDailyQuizForUser(userId: string) {
    let mission = await this.getPendingDailyQuizMissionForUser(userId);

    // Se não houver pendência, usa o quiz gerado no dia atual.
    if (!mission) {
      mission = await this.getTodayDailyQuizMission();
    }

    if (!mission || !mission.quiz) {
      const generated = await this.generateDailyQuizMission();
      if (generated) {
        return {
          ...generated,
          answered: false,
          attempt: null,
        };
      }

      mission = await this.getPendingDailyQuizMissionForUser(userId);
      if (!mission) {
        mission = await this.getTodayDailyQuizMission();
      }
    }

    if (!mission || !mission.quiz) {
      throw new NotFoundException('Quiz diário não encontrado');
    }

    const attempt = await this.prisma.missionQuizAttempt.findUnique({
      where: {
        userId_missionId: {
          userId,
          missionId: mission.id,
        },
      },
    });

    if (!attempt) {
      return {
        missionId: mission.id,
        title: mission.quiz.title,
        question: mission.quiz.question,
        difficulty: mission.quiz.difficulty,
        points: mission.points,
        options: mission.quiz.options,
        answered: false,
        attempt: null,
      };
    }

    return {
      missionId: mission.id,
      title: mission.quiz.title,
      question: mission.quiz.question,
      difficulty: mission.quiz.difficulty,
      points: mission.points,
      options: mission.quiz.options,
      answered: true,
      attempt: {
        selectedIndex: attempt.selectedIndex,
        isCorrect: attempt.isCorrect,
        answeredAt: attempt.answeredAt,
      },
      correctIndex: mission.quiz.correctIndex,
      explanations: mission.quiz.explanations,
      pointsAwarded: attempt.isCorrect ? mission.points : 0,
    };
  }

  /**
   * Completar missão manualmente
   */
  async completeMission(missionId: string, userId: string) {
    const userMission = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
      include: { mission: true },
    });

    if (!userMission) {
      throw new NotFoundException('Você não iniciou esta missão');
    }

    if (userMission.status === MissionStatus.CONCLUIDA) {
      throw new BadRequestException('Esta missão já foi concluída');
    }

    if (userMission.status === MissionStatus.EXPIRADA) {
      throw new BadRequestException('Esta missão expirou');
    }

    await this.prisma.userPoint.create({
      data: {
        userId,
        points: userMission.mission.points,
        source: 'MISSAO',
        description: `Missão concluída: ${userMission.mission.title}`,
        referenceId: missionId,
      },
    });

    await this.gamificationService.checkMissionAchievements(userId);

    return this.prisma.userMission.update({
      where: { userId_missionId: { userId, missionId } },
      data: {
        status: MissionStatus.CONCLUIDA,
        progress: 100,
        completedAt: new Date(),
      },
      include: { mission: true },
    });
  }

  private async getTodayDailyQuizMission() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return this.prisma.mission.findFirst({
      where: {
        type: MissionType.DIARIA,
        classId: null,
        startDate: { gte: startOfDay },
        endDate: { lte: endOfDay },
        quiz: { isNot: null },
      },
      include: {
        quiz: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async getPendingDailyQuizMissionForUser(userId: string) {
    return this.prisma.mission.findFirst({
      where: {
        type: MissionType.DIARIA,
        classId: null,
        quiz: { isNot: null },
        quizAttempts: {
          none: {
            userId,
          },
        },
      },
      include: {
        quiz: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });
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
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const expiredMissions = await this.prisma.mission.findMany({
        where: { type: 'DIARIA', endDate: { lt: now } },
      });

      for (const mission of expiredMissions) {
        await this.prisma.userMission.updateMany({
          where: { missionId: mission.id, status: 'EM_PROGRESSO' },
          data: { status: 'EXPIRADA' },
        });

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
      await this.generateDailyQuizMission();
    } catch (error) {
      console.error('[CRON] Falha no reset de missões diárias:', error);
    }
  }

  private async generateDailyQuizMission() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      console.warn('[Quiz Diário] OPENAI_API_KEY não configurada — geração de quiz ignorada');
      return null;
    }

    // Lock para evitar gerações simultâneas (race condition entre CRON e requests de usuário)
    if (this.dailyQuizGenerationLock) {
      console.log('[Quiz Diário] Geração já em andamento, ignorando requisição duplicada');
      return null;
    }
    this.dailyQuizGenerationLock = true;

    try {
      return await this.doGenerateDailyQuizMission(apiKey);
    } finally {
      this.dailyQuizGenerationLock = false;
    }
  }

  private async doGenerateDailyQuizMission(apiKey: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const existing = await this.prisma.mission.findFirst({
      where: {
        type: 'DIARIA',
        startDate: { gte: startOfDay },
        endDate: { lte: endOfDay },
        quiz: { isNot: null },
      },
      include: { quiz: true },
    });

    if (existing) {
      return null;
    }

    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const targetDifficulty = await this.getTargetDailyDifficulty();
    const prompt = [
      'Gere um quiz diário de programação em português para alunos de graduação em computação.',
      `Nível alvo: ${targetDifficulty}.`,
      'FOCO: Raciocínio lógico, análise de fluxo de execução, depuração e semântica de linguagens (Python, JavaScript, Java, C/C++).',
      'REGRAS TÉCNICAS CRÍTICAS:',
      '1. PRECISÃO SEMÂNTICA: Se o código fornecido resultar em erro (TypeError, SyntaxError, ReferenceError, etc.), a resposta correta DEVE ser o erro correspondente.',
      '2. SEM ALUCINAÇÃO: Não invente saídas para códigos que falham. Analise rigorosamente os tipos e a sintaxe.',
      '3. CÓDIGO REALISTA: Use trechos de código que testem conceitos como escopo, tipos, closures, referências, recursão ou estruturas de dados.',
      '4. FORMATO: Retorne apenas JSON válido no formato exato:',
      '{',
      '"title": "Título curto e instigante",',
      '"question": "Enunciado claro com bloco de código se necessário",',
      '"difficulty": "FACIL" | "MEDIO" | "DIFICIL",',
      '"options": ["A","B","C","D"],',
      '"correctIndex": 0,',
      '"explanations": ["Explicação técnica para A","Explicação para B","Explicação para C","Explicação para D"]',
      '}',
      'REGRAS DE FORMATAÇÃO:',
      '- Exatamente 4 alternativas.',
      '- Explicações devem ser educativas e detalhadas (mínimo 15 palavras cada).',
      '- Não use markdown fora do JSON.',
      '- Se usar código na pergunta, use blocos formatados com \\n.',
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Você é um Professor de Ciência da Computação especialista em semântica de linguagens de programação. Seu objetivo é criar questões de prova rigorosas e tecnicamente impecáveis. Você nunca ignora erros de tipo ou exceções de runtime.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Quiz Diário] Falha na API OpenAI (${response.status}): ${text}`);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[Quiz Diário] Resposta da IA sem conteúdo:', JSON.stringify(data));
      return null;
    }

    let parsed: any;
    try {
      parsed = this.parseJsonFromText(content);
    } catch {
      console.error('[Quiz Diário] Falha ao fazer parse do JSON retornado pela IA:', content);
      return null;
    }
    const title = String(parsed?.title || '').trim();
    const question = String(parsed?.question || '').trim();
    const options = Array.isArray(parsed?.options)
      ? parsed.options
          .map((option) => String(option).trim())
          .filter((option) => option.length > 0)
      : [];
    const explanations = Array.isArray(parsed?.explanations)
      ? parsed.explanations
          .map((exp) => String(exp).trim())
          .filter((exp) => exp.length > 0)
      : [];
    const correctIndex = Number(parsed?.correctIndex);
    const difficultyRaw = String(parsed?.difficulty || '').trim().toUpperCase();
    const difficulty =
      difficultyRaw === 'FACIL' || difficultyRaw === 'MEDIO' || difficultyRaw === 'DIFICIL'
        ? difficultyRaw
        : targetDifficulty;
    const pointsByDifficulty = {
      FACIL: 40,
      MEDIO: 85,
      DIFICIL: 140,
    };
    const points = pointsByDifficulty[difficulty];

    if (!title || !question || options.length !== 4 || explanations.length !== 4) {
      console.error('[Quiz Diário] Estrutura inválida no quiz gerado — campos ausentes ou array com tamanho errado', { title, question, optionsLen: options.length, explanationsLen: explanations.length });
      return null;
    }

    if (title.length > 200) {
      console.error(`[Quiz Diário] title excede 200 caracteres (${title.length})`);
      return null;
    }

    if (question.length > 2000) {
      console.error(`[Quiz Diário] question excede 2000 caracteres (${question.length})`);
      return null;
    }

    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      console.error('[Quiz Diário] correctIndex inválido no quiz gerado:', correctIndex);
      return null;
    }

    // Transaction garante que nunca existe Mission sem MissionQuiz associado
    const mission = await this.prisma.$transaction(async (tx) => {
      const aiGeneration = await tx.aIGeneration.create({
        data: {
          type: 'QUIZ',
          prompt,
          response: content,
          published: true,
        },
      });

      const created = await tx.mission.create({
        data: {
          title,
          description: question,
          type: 'DIARIA',
          points,
          startDate: startOfDay,
          endDate: endOfDay,
        },
      });

      await tx.missionQuiz.create({
        data: {
          missionId: created.id,
          title,
          question,
          difficulty,
          options,
          explanations,
          correctIndex,
          aiGenerationId: aiGeneration.id,
        },
      });

      return created;
    });

    return {
      missionId: mission.id,
      title,
      question,
      difficulty,
      points,
      options,
      answered: false,
      attempt: null,
    };
  }

  private parseJsonFromText(text: string) {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return JSON.parse(trimmed);
    }
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new BadRequestException('Resposta inválida da IA');
    }
    return JSON.parse(match[0]);
  }

  private async getTargetDailyDifficulty(): Promise<Difficulty> {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 14);

    const attempts = await this.prisma.missionQuizAttempt.findMany({
      where: {
        answeredAt: { gte: cutoff },
        mission: {
          type: 'DIARIA',
          classId: null,
        },
      },
      select: {
        isCorrect: true,
      },
    });

    if (attempts.length < 20) {
      return now.getDay() === 0 || now.getDay() === 3 || now.getDay() === 6
        ? 'DIFICIL'
        : 'MEDIO';
    }

    const correctAnswers = attempts.filter((attempt) => attempt.isCorrect).length;
    const accuracy = correctAnswers / attempts.length;

    if (accuracy >= 0.75) {
      return 'DIFICIL';
    }

    if (accuracy <= 0.35) {
      return 'MEDIO';
    }

    return now.getDay() === 0 || now.getDay() === 6 ? 'DIFICIL' : 'MEDIO';
  }

  /**
   * CRON: Auto-reset de missões semanais (Domingo 00:00)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async resetWeeklyMissions() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

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
