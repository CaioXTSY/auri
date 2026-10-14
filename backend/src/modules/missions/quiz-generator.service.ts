import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Difficulty, Prisma } from '@prisma/client';
import {
  buildDailyQuizValidationPrompt,
  buildDailyQuizUserPrompt,
  DAILY_QUIZ_LANGUAGES,
  DAILY_QUIZ_SYSTEM_PROMPT,
  DAILY_QUIZ_TOPICS,
  DAILY_QUIZ_VALIDATION_SYSTEM_PROMPT,
} from './prompts/daily-quiz.prompt';
import { getDailyQuizDateWindow } from './daily-quiz-date';
import {
  GeneratedQuiz,
  normalizeGeneratedQuiz,
  quizWarnings,
  shuffleQuiz,
  quizContentKey,
} from './quiz-quality';
import { appendFileSync } from 'fs';

const END_DATE = new Date('2099-12-31T23:59:59.999Z');
const GENERATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'question', 'difficulty', 'options', 'correctIndex', 'explanations'],
  properties: {
    title: { type: 'string' },
    question: { type: 'string' },
    difficulty: { type: 'string', enum: ['FACIL', 'MEDIO', 'DIFICIL'] },
    options: { type: 'array', items: { type: 'string' } },
    correctIndex: { type: 'integer' },
    explanations: { type: 'array', items: { type: 'string' } },
  },
};
type Usage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
};
export type QuizCallAudit = {
  operation: string;
  model: string;
  prompt: string;
  response: string;
  usage: Usage | null;
  status: number;
  requestId: string | null;
};
export type QuizGenerationOptions = {
  difficulty?: Difficulty;
  topic?: string;
  language?: string;
  evaluation?: boolean;
};

@Injectable()
export class QuizGeneratorService {
  private readonly logger = new Logger(QuizGeneratorService.name);
  private generationPromise: ReturnType<QuizGeneratorService['doGenerateDaily']> | null = null;
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async generateDailyQuizMission() {
    if (this.configService.get<string>('QUIZ_GENERATION_ENABLED') === 'false') return null;
    if (!this.configService.get<string>('OPENAI_API_KEY')) return null;
    if (this.generationPromise) return this.generationPromise;
    const promise = this.doGenerateDaily();
    this.generationPromise = promise;
    try {
      return await promise;
    } finally {
      this.generationPromise = null;
    }
  }

  private async doGenerateDaily() {
    const { startOfDay, endOfDay, dayKey } = getDailyQuizDateWindow(
      new Date(),
      this.configService.get<string>('APP_TIME_ZONE'),
    );
    const existing = await this.prisma.mission.findFirst({
      where: {
        type: 'DIARIA',
        classId: null,
        startDate: { gte: startOfDay, lte: endOfDay },
        quiz: { isNot: null },
      },
      include: { quiz: true },
    });
    if (existing) return null;
    try {
      const result = await this.generateReviewedQuiz();
      if (!result.quiz) return null;
      const quiz = result.quiz;
      const mission = await this.prisma.$transaction(async (tx) => {
        const found = await tx.mission.findFirst({
          where: { dailyKey: dayKey },
          include: { quiz: true },
        });
        if (found) return found;
        return tx.mission.create({
          data: {
            title: quiz.title,
            description: quiz.question,
            type: 'DIARIA',
            dailyKey: dayKey,
            points: this.getPointsForDifficulty(quiz.difficulty),
            startDate: startOfDay,
            endDate: END_DATE,
            quiz: { create: this.quizData(quiz, result.generationId, false) },
          },
          include: { quiz: true },
        });
      });
      if (mission.quiz?.reviewStatus !== 'APPROVED') {
        this.logger.log(`Quiz diário ${mission.id} aguardando revisão autorizada`);
        return null;
      }
      return {
        missionId: mission.id,
        title: mission.quiz.title,
        question: mission.quiz.question,
        difficulty: mission.quiz.difficulty,
        points: mission.points,
        options: mission.quiz.options,
        answered: false as const,
        attempt: null as null,
      };
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'))
        this.logger.error('Falha ao persistir quiz diário');
      return null;
    }
  }

  // Production pipeline reused by the isolated experiment, including real persistence.
  async generateReviewedQuiz(options: QuizGenerationOptions = {}) {
    if (this.configService.get<string>('QUIZ_GENERATION_ENABLED') === 'false')
      throw new BadRequestException('Geração desabilitada neste ambiente');
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) throw new BadRequestException('OPENAI_API_KEY não configurada');
    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const reviewModel = this.configService.get<string>('OPENAI_REVIEW_MODEL') || 'gpt-4.1-mini';
    const difficulty = options.difficulty ?? (await this.getTargetDailyDifficulty());
    const recentQuizzes = await this.getRecentQuizSummaries(14);
    const languageHint =
      options.language ??
      DAILY_QUIZ_LANGUAGES.filter(
        (l) => !recentQuizzes.slice(0, 3).some((q) => q.language === l),
      ).join(', ');
    const audit: QuizCallAudit[] = [];
    let quiz: GeneratedQuiz | null = null;
    let reason = '',
      promptUsed = '',
      responseUsed = '';
    let returnedDifficulty: string | null = null;
    let generationAttempts = 0;
    for (let attempt = 1; attempt <= 3; attempt++) {
      generationAttempts++;
      promptUsed = buildDailyQuizUserPrompt({
        difficulty,
        languageHint,
        suggestedTopic:
          options.topic ?? DAILY_QUIZ_TOPICS[Math.floor(Math.random() * DAILY_QUIZ_TOPICS.length)],
        recentQuizzes: recentQuizzes.slice(0, 14),
      });
      if (reason)
        promptUsed += `\nA tentativa anterior foi rejeitada por: ${reason}. Gere uma nova questão corrigida.`;
      try {
        responseUsed = await this.completion(
          apiKey,
          model,
          'generation',
          DAILY_QUIZ_SYSTEM_PROMPT,
          promptUsed,
          audit,
        );
        try {
          returnedDifficulty = JSON.parse(responseUsed)?.difficulty ?? null;
        } catch {
          returnedDifficulty = null;
        }
        const parsed = normalizeGeneratedQuiz(responseUsed, difficulty);
        if (
          recentQuizzes.some(
            (recent) => quizContentKey(recent.question) === quizContentKey(parsed.question),
          )
        )
          throw new BadRequestException(
            'Enunciado repetido no histórico recente; gere um exemplo diferente',
          );
        const warnings = quizWarnings(parsed);
        if (warnings.length)
          throw new BadRequestException(
            warnings.join(', ') +
              ': não use primeira/segunda/terceira/quarta alternativa ou letras/ordens nas explicações; uma opção incorreta não pode ser descrita como correta',
          );
        const review = JSON.parse(
          await this.completion(
            apiKey,
            reviewModel,
            'semantic_review',
            DAILY_QUIZ_VALIDATION_SYSTEM_PROMPT,
            buildDailyQuizValidationPrompt(parsed),
            audit,
          ),
        );
        if (
          review.isValid !== true ||
          typeof review.correctIndex !== 'number' ||
          review.correctIndex !== parsed.correctIndex
        )
          throw new BadRequestException(String(review.reason || 'Revisor discordou do gabarito'));
        quiz = shuffleQuiz(parsed);
        break;
      } catch (error) {
        reason = error instanceof Error ? error.message : 'Falha de validação';
        this.logger.warn(`Quiz rejeitado na tentativa ${attempt}/3: ${reason}`);
        if (audit.some((call) => [401, 403, 429].includes(call.status))) break;
      }
    }
    const complete = audit.every((call) => call.usage !== null);
    const usage = audit.reduce(
      (total, call) => ({
        inputTokens: total.inputTokens + (call.usage?.inputTokens ?? 0),
        outputTokens: total.outputTokens + (call.usage?.outputTokens ?? 0),
        totalTokens: total.totalTokens + (call.usage?.totalTokens ?? 0),
      }),
      { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    );
    const generation = await this.prisma.aIGeneration.create({
      data: {
        type: options.evaluation ? 'QUIZ_EVALUATION' : 'QUIZ',
        model,
        prompt: promptUsed,
        response: responseUsed,
        inputTokens: complete ? usage.inputTokens : null,
        outputTokens: complete ? usage.outputTokens : null,
        totalTokens: complete ? usage.totalTokens : null,
        generationAttempts,
        validationCalls: audit.filter((call) => call.operation === 'semantic_review').length,
        requestedDifficulty: difficulty,
        returnedDifficulty,
        status: quiz ? 'VALIDATED' : 'REJECTED',
        callAudit: audit as unknown as Prisma.InputJsonValue,
      },
    });
    return {
      quiz,
      generationId: generation.id,
      audit,
      reason: quiz ? null : reason,
      requestedDifficulty: difficulty,
      returnedDifficulty,
    };
  }

  async generateEvaluationQuiz(
    options: Required<Pick<QuizGenerationOptions, 'difficulty' | 'topic' | 'language'>>,
  ) {
    if (this.configService.get<string>('AURI_EVALUATION_MODE') !== 'true')
      throw new BadRequestException('Modo de avaliação isolada obrigatório');
    const db = new URL(this.configService.get<string>('DATABASE_URL') || 'mysql://invalid/invalid');
    if (!['localhost', '127.0.0.1'].includes(db.hostname) || !db.pathname.startsWith('/auri_tcc_'))
      throw new BadRequestException('Banco local de avaliação obrigatório');
    const result = await this.generateReviewedQuiz({ ...options, evaluation: true });
    if (!result.quiz) return { ...result, mission: null };
    const quiz = result.quiz;
    const mission = await this.prisma.mission.create({
      data: {
        title: quiz.title,
        description: quiz.question,
        type: 'PERSONALIZADA',
        points: this.getPointsForDifficulty(quiz.difficulty),
        startDate: new Date(),
        endDate: END_DATE,
        quiz: { create: this.quizData(quiz, result.generationId, true) },
      },
      include: { quiz: true },
    });
    return { ...result, mission };
  }

  private quizData(quiz: GeneratedQuiz, generationId: string, evaluation: boolean) {
    const humanReview = this.configService.get<string>('QUIZ_REVIEW_MODE') !== 'automatic';
    return {
      ...quiz,
      aiGenerationId: generationId,
      reviewStatus: evaluation || humanReview ? 'PENDING' : 'APPROVED',
      qualityWarnings: quizWarnings(quiz),
      reviewReason:
        evaluation || humanReview
          ? null
          : 'Publicação automática configurada; sem validação pedagógica humana',
    };
  }

  private async completion(
    apiKey: string,
    model: string,
    operation: string,
    system: string,
    prompt: string,
    audit: QuizCallAudit[],
  ) {
    const entry: QuizCallAudit = {
      operation,
      model,
      prompt,
      response: '',
      usage: null,
      status: 0,
      requestId: null,
    };
    audit.push(entry);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(90000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: operation === 'generation' ? 0.2 : 0,
        max_completion_tokens: 3000,
        response_format:
          operation === 'generation'
            ? {
                type: 'json_schema',
                json_schema: { name: 'auri_quiz', strict: true, schema: GENERATION_SCHEMA },
              }
            : { type: 'json_object' },
        store: false,
      }),
    });
    entry.status = response.status ?? (response.ok ? 200 : 500);
    entry.requestId = response.headers?.get('x-request-id') ?? null;
    if (!response.ok) throw new BadRequestException(`OpenAI HTTP ${entry.status}`);
    const data = await response.json();
    entry.model = data.model ?? model;
    entry.response = data?.choices?.[0]?.message?.content ?? '';
    if (
      data.usage &&
      [data.usage.prompt_tokens, data.usage.completion_tokens, data.usage.total_tokens].every(
        Number.isInteger,
      )
    )
      entry.usage = {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        cachedInputTokens: data.usage.prompt_tokens_details?.cached_tokens ?? 0,
      };
    const auditFile = this.configService.get<string>('OPENAI_AUDIT_FILE');
    if (auditFile) appendFileSync(auditFile, JSON.stringify(entry) + '\n');
    if (
      !entry.response ||
      (data.choices[0].finish_reason && data.choices[0].finish_reason !== 'stop')
    )
      throw new BadRequestException('Resposta vazia ou incompleta');
    return entry.response;
  }

  private async getRecentQuizSummaries(days: number) {
    const quizzes = await this.prisma.missionQuiz.findMany({
      where: {
        aiGenerationId: { not: null },
        createdAt: { gte: new Date(Date.now() - days * 86400000) },
      },
      select: { title: true, question: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return quizzes.map((q) => ({
      title: q.title,
      question: q.question,
      topic: q.title,
      language: q.question.match(/\b(Python|JavaScript|Java|C\+\+)\b/i)?.[1] ?? null,
    }));
  }

  private async getTargetDailyDifficulty(): Promise<Difficulty> {
    const attempts = await this.prisma.missionQuizAttempt.findMany({
      where: {
        answeredAt: { gte: new Date(Date.now() - 14 * 86400000) },
        mission: { type: 'DIARIA', classId: null },
      },
      select: { isCorrect: true },
    });
    if (attempts.length >= 20) {
      const accuracy = attempts.filter((a) => a.isCorrect).length / attempts.length;
      return accuracy <= 0.35 ? 'FACIL' : accuracy >= 0.75 ? 'DIFICIL' : 'MEDIO';
    }
    const { dayKey } = getDailyQuizDateWindow(
      new Date(),
      this.configService.get<string>('APP_TIME_ZONE'),
    );
    return (['FACIL', 'MEDIO', 'DIFICIL'] as const)[Math.floor(Date.parse(dayKey) / 86400000) % 3];
  }

  private getPointsForDifficulty(difficulty: Difficulty) {
    return { FACIL: 40, MEDIO: 85, DIFICIL: 140 }[difficulty];
  }
}
