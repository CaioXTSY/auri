import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeneratedQuiz, validateQuizShape, quizWarnings } from './quiz-quality';

@Injectable()
export class QuizReviewService {
  constructor(private prisma: PrismaService) {}
  private async authorize(userId: string, role: string, missionId?: string) {
    if (!['ADMIN', 'PROFESSOR'].includes(role))
      throw new ForbiddenException('Revisão restrita a responsáveis');
    if (missionId) {
      const mission = await this.prisma.mission.findUnique({
        where: { id: missionId },
        include: { class: true },
      });
      if (!mission) throw new NotFoundException('Missão não encontrada');
      if (
        role === 'PROFESSOR' &&
        mission.createdById !== userId &&
        mission.class?.createdById !== userId
      )
        throw new ForbiddenException('Professor não é responsável por esta missão');
    }
  }
  async list(userId: string, role: string) {
    await this.authorize(userId, role);
    return this.prisma.missionQuiz.findMany({
      where: {
        reviewStatus: 'PENDING',
        ...(role === 'PROFESSOR'
          ? { mission: { OR: [{ createdById: userId }, { class: { createdById: userId } }] } }
          : {}),
      },
      include: { mission: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }
  async decide(
    missionId: string,
    userId: string,
    role: string,
    decision: 'APPROVED' | 'REJECTED',
    reason: string,
  ) {
    await this.authorize(userId, role, missionId);
    if (!['APPROVED', 'REJECTED'].includes(decision) || !reason?.trim())
      throw new BadRequestException('Decisão e justificativa são obrigatórias');
    return this.prisma.$transaction(async (tx) => {
      const quiz = await tx.missionQuiz.findUnique({ where: { missionId } });
      if (!quiz) throw new NotFoundException('Quiz não encontrado');
      if (quiz.reviewStatus !== 'PENDING') throw new BadRequestException('Quiz já revisado');
      if (decision === 'APPROVED') {
        validateQuizShape(quiz as unknown as GeneratedQuiz);
        if (quizWarnings(quiz as unknown as GeneratedQuiz).length)
          throw new BadRequestException('Resolva os alertas de qualidade antes de aprovar');
      }
      const updated = await tx.missionQuiz.updateMany({
        where: { missionId, reviewStatus: 'PENDING' },
        data: {
          reviewStatus: decision,
          reviewedById: userId,
          reviewedAt: new Date(),
          reviewReason: reason.trim(),
        },
      });
      if (updated.count !== 1)
        throw new BadRequestException('Decisão concorrente; recarregue o quiz');
      return tx.missionQuiz.findUniqueOrThrow({ where: { missionId } });
    });
  }
}
