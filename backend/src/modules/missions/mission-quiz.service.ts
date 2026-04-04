import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnswerQuizDto } from './dto/answer-quiz.dto';
import { GamificationService } from '../gamification/gamification.service';
import { MissionType, MissionStatus } from '@prisma/client';
import { QuizGeneratorService } from './quiz-generator.service';

@Injectable()
export class MissionQuizService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
    private quizGeneratorService: QuizGeneratorService,
  ) {}

  async startMission(missionId: string, userId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        class: {
          select: { id: true, name: true },
        },
        userMissions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!mission) {
      throw new NotFoundException(`Missão com ID ${missionId} não encontrada`);
    }

    const now = new Date();
    if (now < mission.startDate || now > mission.endDate) {
      throw new BadRequestException('Esta missão não está mais disponível');
    }

    if (mission.classId) {
      const enrolled = await this.prisma.classStudent.findUnique({
        where: { classId_userId: { classId: mission.classId, userId } },
      });
      if (!enrolled) {
        throw new ForbiddenException('Você não está matriculado na turma desta missão');
      }
    }

    const existing = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });

    if (existing) {
      throw new BadRequestException('Você já iniciou esta missão');
    }

    return this.prisma.userMission.create({
      data: {
        userId,
        missionId,
        status: MissionStatus.EM_PROGRESSO,
        progress: 0,
      },
      include: {
        mission: { include: { class: true } },
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
      include: { quiz: true },
    });

    if (!mission || !mission.quiz) {
      throw new NotFoundException('Quiz da missão não encontrado');
    }

    if (mission.classId) {
      const enrolled = await this.prisma.classStudent.findUnique({
        where: { classId_userId: { classId: mission.classId, userId } },
      });
      if (!enrolled) {
        throw new ForbiddenException('Você não está matriculado na turma desta missão');
      }
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

    const priorAttempt = await this.prisma.missionQuizAttempt.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });
    if (priorAttempt?.isCorrect) {
      throw new BadRequestException('Você já respondeu corretamente este quiz');
    }

    await this.prisma.$transaction(async (tx) => {
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
        await tx.userMission.update({
          where: { userId_missionId: { userId, missionId } },
          data: {
            status: MissionStatus.CONCLUIDA,
            progress: 100,
            completedAt: new Date(),
          },
        });

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

    await this.gamificationService.checkMissionAchievements(userId);
    await this.gamificationService.checkQuizAchievements(userId);

    let newStreak: number | undefined;
    if (isCorrect && mission.type === MissionType.DIARIA) {
      const streakResult = await this.gamificationService.updateStreak(userId);
      newStreak = streakResult.newStreak;
      await this.gamificationService.checkStreakAchievements(userId, newStreak);
    }

    return {
      isCorrect,
      correctIndex: mission.quiz.correctIndex,
      explanations: mission.quiz.explanations,
      selectedIndex: answerQuizDto.selectedIndex,
      difficulty: mission.quiz.difficulty,
      pointsAwarded: isCorrect ? mission.points : 0,
      newStreak,
    };
  }

  async getDailyQuiz() {
    let mission = await this.getTodayDailyQuizMission();

    if (!mission || !mission.quiz) {
      const generated = await this.quizGeneratorService.generateDailyQuizMission();
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
    let mission = await this.getTodayDailyQuizMission();

    if (!mission || !mission.quiz) {
      const generated = await this.quizGeneratorService.generateDailyQuizMission();
      if (generated) {
        return {
          ...generated,
          answered: false,
          attempt: null,
        };
      }

      mission = await this.getTodayDailyQuizMission();
    }

    if (!mission || !mission.quiz) {
      throw new NotFoundException('Quiz diário não encontrado');
    }

    const attempt = await this.prisma.missionQuizAttempt.findUnique({
      where: { userId_missionId: { userId, missionId: mission.id } },
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
      include: { quiz: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
