import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Difficulty } from '@prisma/client';
import {
  buildDailyQuizValidationPrompt,
  buildDailyQuizUserPrompt,
  DAILY_QUIZ_LANGUAGES,
  DAILY_QUIZ_SYSTEM_PROMPT,
  DAILY_QUIZ_TOPICS,
  DAILY_QUIZ_VALIDATION_SYSTEM_PROMPT,
} from './prompts/daily-quiz.prompt';
import { getDailyQuizDateWindow } from './daily-quiz-date';

const PERMANENT_MISSION_END_DATE = new Date('2099-12-31T23:59:59.999Z');
const DAILY_QUIZ_GENERATION_MAX_ATTEMPTS = 3;

type GeneratedQuiz = {
  title: string;
  question: string;
  difficulty: Difficulty;
  options: string[];
  correctIndex: number;
  explanations: string[];
};

type GeneratedDailyQuizMission = {
  missionId: string;
  title: string;
  question: string;
  difficulty: Difficulty;
  points: number;
  options: string[];
  answered: false;
  attempt: null;
};

type OpenAIUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

type OpenAICompletion = {
  content: string;
  usage: OpenAIUsage | null;
};

type QuizValidation = {
  isValid: boolean;
  correctIndex: number | null;
  reason: string;
  usage: OpenAIUsage | null;
};

@Injectable()
export class QuizGeneratorService {
  private readonly logger = new Logger(QuizGeneratorService.name);
  private generationPromise: Promise<GeneratedDailyQuizMission | null> | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async generateDailyQuizMission() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY nao configurada; geracao de quiz diario ignorada');
      return null;
    }

    if (this.generationPromise) {
      this.logger.log('Geracao de quiz diario ja em andamento, aguardando requisicao existente');
      return this.generationPromise;
    }

    const generationPromise = this.doGenerateDaily(apiKey);
    this.generationPromise = generationPromise;

    try {
      return await generationPromise;
    } finally {
      if (this.generationPromise === generationPromise) {
        this.generationPromise = null;
      }
    }
  }

  private async doGenerateDaily(apiKey: string): Promise<GeneratedDailyQuizMission | null> {
    const { startOfDay } = getDailyQuizDateWindow(
      new Date(),
      this.configService.get<string>('APP_TIME_ZONE'),
    );

    const existing = await this.prisma.mission.findFirst({
      where: {
        type: 'DIARIA',
        classId: null,
        startDate: { gte: startOfDay },
        quiz: { isNot: null },
      },
      include: { quiz: true },
    });

    if (existing) {
      return null;
    }

    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const [targetDifficulty, recentQuizzes] = await Promise.all([
      this.getTargetDailyDifficulty(),
      this.getRecentQuizSummaries(14),
    ]);

    const usedLanguages = recentQuizzes.map((q) => q.language).filter(Boolean);
    const preferredLanguages = DAILY_QUIZ_LANGUAGES.filter(
      (l) => !usedLanguages.slice(0, 3).includes(l),
    );
    const languageHint =
      preferredLanguages.length > 0
        ? preferredLanguages.slice(0, 3).join(', ')
        : DAILY_QUIZ_LANGUAGES.join(', ');
    let promptUsed = '';
    let content = '';
    let quiz: GeneratedQuiz | null = null;
    let lastValidationReason = '';
    let generationAttempts = 0;
    let validationCalls = 0;
    let usageComplete = true;
    const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    const includeUsage = (callUsage: OpenAIUsage | null) => {
      if (!callUsage) {
        usageComplete = false;
        return;
      }
      usage.inputTokens += callUsage.inputTokens;
      usage.outputTokens += callUsage.outputTokens;
      usage.totalTokens += callUsage.totalTokens;
    };

    try {
      for (let attempt = 1; attempt <= DAILY_QUIZ_GENERATION_MAX_ATTEMPTS; attempt += 1) {
        const randomTopic = DAILY_QUIZ_TOPICS[Math.floor(Math.random() * DAILY_QUIZ_TOPICS.length)];
        const basePrompt = buildDailyQuizUserPrompt({
          difficulty: targetDifficulty,
          languageHint,
          suggestedTopic: randomTopic,
          recentQuizzes,
        });

        promptUsed =
          attempt === 1
            ? basePrompt
            : [
                basePrompt,
                '',
                'CORRECAO OBRIGATORIA PARA ESTA NOVA TENTATIVA:',
                `- A tentativa anterior foi rejeitada por: ${lastValidationReason || 'falha tecnica na validacao'}.`,
                '- Gere uma NOVA questao completa.',
                '- Garanta que a alternativa correta e as explicacoes estejam tecnicamente consistentes entre si.',
                '- Se houver codigo, explicite escopo, ordem de execucao, valor final ou erro sem ambiguidades.',
              ].join('\n');

        generationAttempts += 1;
        const generation = await this.requestQuizGeneration(apiKey, model, promptUsed);
        content = generation.content;
        includeUsage(generation.usage);
        quiz = this.normalizeGeneratedQuiz(content, targetDifficulty);
        validationCalls += 1;
        const validation = await this.validateGeneratedQuiz(apiKey, model, quiz);
        includeUsage(validation.usage);

        if (validation.isValid && validation.correctIndex === quiz.correctIndex) {
          break;
        }

        lastValidationReason = validation.reason;
        this.logger.warn(
          `Quiz diario rejeitado na tentativa ${attempt}/${DAILY_QUIZ_GENERATION_MAX_ATTEMPTS}: ` +
            `isValid=${validation.isValid}, correctIndex=${validation.correctIndex}, expected=${quiz.correctIndex}, reason="${validation.reason}"`,
        );

        quiz = null;
      }

      if (!quiz) {
        this.logger.error('Falha ao gerar quiz diario valido apos multiplas tentativas');
        return null;
      }

      const points = this.getPointsForDifficulty(quiz.difficulty);
      const mission = await this.prisma.$transaction(async (tx) => {
        const existingMission = await tx.mission.findFirst({
          where: {
            type: 'DIARIA',
            classId: null,
            startDate: { gte: startOfDay },
            quiz: { isNot: null },
          },
          include: { quiz: true },
        });

        if (existingMission?.quiz) {
          return existingMission;
        }

        const aiGeneration = await tx.aIGeneration.create({
          data: {
            type: 'QUIZ',
            prompt: promptUsed,
            response: content,
            model,
            inputTokens: usageComplete ? usage.inputTokens : null,
            outputTokens: usageComplete ? usage.outputTokens : null,
            totalTokens: usageComplete ? usage.totalTokens : null,
            generationAttempts,
            validationCalls,
          },
        });

        const created = await tx.mission.create({
          data: {
            title: quiz.title,
            description: quiz.question,
            type: 'DIARIA',
            points,
            startDate: startOfDay,
            endDate: PERMANENT_MISSION_END_DATE,
          },
        });

        await tx.missionQuiz.create({
          data: {
            missionId: created.id,
            title: quiz.title,
            question: quiz.question,
            difficulty: quiz.difficulty,
            options: quiz.options,
            explanations: quiz.explanations,
            correctIndex: quiz.correctIndex,
            aiGenerationId: aiGeneration.id,
          },
        });

        return tx.mission.findUniqueOrThrow({
          where: { id: created.id },
          include: { quiz: true },
        });
      });

      return {
        missionId: mission.id,
        title: mission.quiz?.title ?? quiz.title,
        question: mission.quiz?.question ?? quiz.question,
        difficulty: mission.quiz?.difficulty ?? quiz.difficulty,
        points: mission.points,
        options: Array.isArray(mission.quiz?.options)
          ? (mission.quiz.options as string[])
          : quiz.options,
        answered: false,
        attempt: null,
      };
    } catch (error) {
      this.logger.error(`Falha ao gerar quiz diario: ${error}`);
      return null;
    }
  }

  private async requestQuizGeneration(
    apiKey: string,
    model: string,
    prompt: string,
  ): Promise<OpenAICompletion> {
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
            content: DAILY_QUIZ_SYSTEM_PROMPT,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Falha na API OpenAI (${response.status}): ${text}`);
      throw new BadRequestException('Falha ao gerar questao com OpenAI');
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      this.logger.error(`Resposta da IA sem conteudo: ${JSON.stringify(data)}`);
      throw new BadRequestException('Resposta vazia da OpenAI');
    }

    return { content, usage: this.extractUsage(data?.usage) };
  }

  private normalizeGeneratedQuiz(content: string, fallbackDifficulty: Difficulty): GeneratedQuiz {
    const parsed = this.parseJsonFromText(content);
    const title = String(parsed?.title || '').trim();
    const question = String(parsed?.question || '').trim();
    const options = Array.isArray(parsed?.options)
      ? parsed.options
          .map((option: unknown) => String(option).trim())
          .filter((option: string) => option.length > 0)
      : [];
    const explanations = Array.isArray(parsed?.explanations)
      ? parsed.explanations
          .map((exp: unknown) => String(exp).trim())
          .filter((exp: string) => exp.length > 0)
      : [];
    const correctIndex = Number(parsed?.correctIndex);
    const difficultyRaw = String(parsed?.difficulty || '')
      .trim()
      .toUpperCase();
    const difficulty =
      difficultyRaw === 'FACIL' || difficultyRaw === 'MEDIO' || difficultyRaw === 'DIFICIL'
        ? difficultyRaw
        : fallbackDifficulty;

    const quiz = {
      title,
      question,
      difficulty,
      options,
      correctIndex,
      explanations,
    };

    this.validateQuizShape(quiz);
    return quiz;
  }

  private validateQuizShape(quiz: GeneratedQuiz) {
    if (
      !quiz.title ||
      !quiz.question ||
      quiz.options.length !== 4 ||
      quiz.explanations.length !== 4
    ) {
      throw new BadRequestException(
        `Estrutura invalida no quiz: title="${quiz.title}", optionsLen=${quiz.options.length}, explanationsLen=${quiz.explanations.length}`,
      );
    }

    if (quiz.title.length > 200) {
      throw new BadRequestException(`title do quiz excede 200 caracteres (${quiz.title.length})`);
    }

    if (quiz.question.length > 2000) {
      throw new BadRequestException(
        `question do quiz excede 2000 caracteres (${quiz.question.length})`,
      );
    }

    if (!Number.isInteger(quiz.correctIndex) || quiz.correctIndex < 0 || quiz.correctIndex > 3) {
      throw new BadRequestException(`correctIndex invalido no quiz: ${quiz.correctIndex}`);
    }
  }

  private async validateGeneratedQuiz(
    apiKey: string,
    model: string,
    quiz: GeneratedQuiz,
  ): Promise<QuizValidation> {
    const validationPrompt = buildDailyQuizValidationPrompt(quiz);

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
            content: DAILY_QUIZ_VALIDATION_SYSTEM_PROMPT,
          },
          { role: 'user', content: validationPrompt },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Falha na validacao OpenAI (${response.status}): ${text}`);
      return {
        isValid: false,
        correctIndex: null,
        reason: 'Falha na chamada de validacao',
        usage: null,
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      this.logger.error(`Validacao da IA sem conteudo: ${JSON.stringify(data)}`);
      return {
        isValid: false,
        correctIndex: null,
        reason: 'Resposta de validacao vazia',
        usage: this.extractUsage(data?.usage),
      };
    }

    try {
      const parsed = this.parseJsonFromText(content);
      const isValid = parsed?.isValid === true;
      const validationCorrectIndex = Number(parsed?.correctIndex);
      const correctIndex = Number.isInteger(validationCorrectIndex) ? validationCorrectIndex : null;
      const reason = String(parsed?.reason || '').trim();

      return { isValid, correctIndex, reason, usage: this.extractUsage(data?.usage) };
    } catch {
      this.logger.error(`Falha ao fazer parse do JSON de validacao da IA: ${content}`);
      return {
        isValid: false,
        correctIndex: null,
        reason: 'JSON de validacao invalido',
        usage: this.extractUsage(data?.usage),
      };
    }
  }

  private extractUsage(rawUsage: unknown): OpenAIUsage | null {
    if (!rawUsage || typeof rawUsage !== 'object') {
      return null;
    }

    const usage = rawUsage as Record<string, unknown>;
    const inputTokens = Number(usage.prompt_tokens ?? usage.input_tokens);
    const outputTokens = Number(usage.completion_tokens ?? usage.output_tokens);
    const totalTokens = Number(usage.total_tokens);

    if (
      !Number.isFinite(inputTokens) ||
      !Number.isFinite(outputTokens) ||
      !Number.isFinite(totalTokens)
    ) {
      return null;
    }

    return { inputTokens, outputTokens, totalTokens };
  }

  private parseJsonFromText(text: string) {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return JSON.parse(trimmed);
    }
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new BadRequestException('Resposta invalida da IA');
    }
    return JSON.parse(match[0]);
  }

  private async getRecentQuizSummaries(
    days: number,
  ): Promise<{ title: string; topic: string; language: string | null }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const quizzes = await this.prisma.missionQuiz.findMany({
      where: {
        mission: {
          type: 'DIARIA',
          startDate: { gte: cutoff },
        },
      },
      select: { title: true, question: true },
      orderBy: { id: 'desc' },
      take: days,
    });

    return quizzes.map((q) => {
      const { language, topic } = this.summarizeQuizQuestion(q.title, q.question);
      return { title: q.title, topic, language };
    });
  }

  private summarizeQuizQuestion(title: string, question: string) {
    const languageMatch = question.match(
      /\b(Python|JavaScript|TypeScript|Java|C\+\+|C#|C(?!#|\+))\b/i,
    );
    const language = languageMatch ? languageMatch[1] : null;
    const topicMatch = question.match(
      /(?:def |function |class |public |void |int |str |let |const )?(\w[\w\s]{3,40}?)(?:\(|:|\n|\.)/,
    );
    const topic = topicMatch ? topicMatch[1].trim() : title;
    return { language, topic };
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
      select: { isCorrect: true },
    });

    if (attempts.length < 20) {
      return now.getDay() === 0 || now.getDay() === 3 || now.getDay() === 6 ? 'DIFICIL' : 'MEDIO';
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

  private getPointsForDifficulty(difficulty: Difficulty) {
    const pointsByDifficulty = {
      FACIL: 40,
      MEDIO: 85,
      DIFICIL: 140,
    };
    return pointsByDifficulty[difficulty];
  }
}
