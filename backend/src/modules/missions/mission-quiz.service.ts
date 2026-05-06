import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MissionStatus, MissionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { AnswerQuizDto } from './dto/answer-quiz.dto';
import { getDailyQuizDateWindow } from './daily-quiz-date';
import { QuizGeneratorService } from './quiz-generator.service';

@Injectable()
export class MissionQuizService {
  private static readonly DAILY_QUIZ_GENERATION_RETRY_DELAYS_MS = [500, 1000, 1500, 2500, 4000, 5000];

  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
    private quizGeneratorService: QuizGeneratorService,
    private configService: ConfigService,
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
    if (now < mission.startDate) {
      throw new BadRequestException('Esta missão ainda não está disponível');
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
    if (
      mission.type !== MissionType.DIARIA &&
      now < mission.startDate
    ) {
      throw new BadRequestException('Esta missão ainda não está disponível');
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
        ? {
            selectedIndex: attempt.selectedIndex,
            isCorrect: attempt.isCorrect,
            answeredAt: attempt.answeredAt,
          }
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
    if (
      mission.type !== MissionType.DIARIA &&
      now < mission.startDate
    ) {
      throw new BadRequestException('Esta missão ainda não está disponível');
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
      }
    });

    if (isCorrect) {
      await this.gamificationService.addPoints(
        userId,
        mission.points,
        'MISSAO',
        `Quiz concluído: ${mission.title}`,
        missionId,
      );
    }

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
    const mission = await this.getOrCreateTodayDailyQuizMission();

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
    const mission = await this.getOrCreateTodayDailyQuizMission();

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

  async getRandomQuizMission(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        classEnrollments: { select: { classId: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
    }

    const now = new Date();
    const userClassIds = user.classEnrollments.map((enrollment) => enrollment.classId);

    const candidates = await this.prisma.mission.findMany({
      where: {
        startDate: { lte: now },
        quiz: { isNot: null },
        quizAttempts: {
          none: {
            userId,
            isCorrect: true,
          },
        },
        OR: [
          { classId: null },
          { classId: { in: userClassIds } },
        ],
      },
      select: {
        id: true,
        title: true,
        type: true,
        points: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (candidates.length === 0) {
      throw new NotFoundException('Nenhuma questão aleatória disponível no momento');
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
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

    const completedMission = await this.prisma.userMission.update({
      where: { userId_missionId: { userId, missionId } },
      data: {
        status: MissionStatus.CONCLUIDA,
        progress: 100,
        completedAt: new Date(),
      },
      include: { mission: true },
    });

    await this.gamificationService.addPoints(
      userId,
      userMission.mission.points,
      'MISSAO',
      `Missão concluída: ${userMission.mission.title}`,
      missionId,
    );

    await this.gamificationService.checkMissionAchievements(userId);

    return completedMission;
  }

  private async getTodayDailyQuizMission() {
    const { startOfDay, endOfDay } = getDailyQuizDateWindow(
      new Date(),
      this.configService.get<string>('APP_TIME_ZONE'),
    );

    return this.prisma.mission.findFirst({
      where: {
        type: MissionType.DIARIA,
        classId: null,
        startDate: { gte: startOfDay },
        quiz: { isNot: null },
      },
      include: { quiz: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOrCreateTodayDailyQuizMission() {
    let mission = await this.getTodayDailyQuizMission();

    if (mission?.quiz) {
      return mission;
    }

    const generated = await this.quizGeneratorService.generateDailyQuizMission();
    if (generated) {
      mission = await this.getTodayDailyQuizMission();
      if (mission?.quiz) {
        return mission;
      }
    }

    return this.waitForTodayDailyQuizMission();
  }

  private async waitForTodayDailyQuizMission() {
    for (const delayMs of MissionQuizService.DAILY_QUIZ_GENERATION_RETRY_DELAYS_MS) {
      await this.sleep(delayMs);
      const mission = await this.getTodayDailyQuizMission();
      if (mission?.quiz) {
        return mission;
      }
    }

    return this.getTodayDailyQuizMission();
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
