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
import { GenerateMissionQuizDto } from './dto/generate-mission-quiz.dto';

type GeneratedQuiz = {
  title: string;
  question: string;
  difficulty: Difficulty;
  options: string[];
  correctIndex: number;
  explanations: string[];
};

type RecentQuizSummary = {
  title: string;
  question: string;
  topic: string;
  language: string | null;
};

@Injectable()
export class QuizGeneratorService {
  private readonly logger = new Logger(QuizGeneratorService.name);
  private generationLock = false;

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

    if (this.generationLock) {
      this.logger.log('Geracao de quiz diario ja em andamento, ignorando requisicao duplicada');
      return null;
    }

    this.generationLock = true;
    const dayKey = getDailyQuizDateWindow(
      new Date(),
      this.configService.get<string>('APP_TIME_ZONE'),
    ).dayKey;
    const lockName = `auri:daily-quiz:${dayKey}`;

    try {
      const lockAcquired = await this.acquireGenerationLock(lockName);
      if (!lockAcquired) {
        this.logger.log(`Geracao de quiz diario ja bloqueada por outra instancia (${dayKey})`);
        return null;
      }

      return await this.doGenerateDaily(apiKey);
    } finally {
      await this.releaseGenerationLock(lockName);
      this.generationLock = false;
    }
  }

  async generateAdminQuizMission(params: GenerateMissionQuizDto, createdById: string) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('OPENAI_API_KEY nao configurada');
    }

    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const startDate = params.startDate ? new Date(params.startDate) : new Date();
    const endDate = params.endDate ? new Date(params.endDate) : this.addDays(startDate, 7);

    if (startDate >= endDate) {
      throw new BadRequestException('A data de inicio deve ser anterior a data de termino');
    }

    const recentQuizzes = await this.getRecentQuizSummariesByCount(15);
    const prompt = this.buildAdminQuizPrompt(params, recentQuizzes);
    const content = await this.requestQuizGeneration(apiKey, model, prompt);
    const quiz = this.normalizeGeneratedQuiz(content, params.difficulty);
    const validation = await this.validateGeneratedQuiz(apiKey, model, quiz);

    if (!validation.isValid || validation.correctIndex !== quiz.correctIndex) {
      throw new BadRequestException(
        `Questao rejeitada pela validacao tecnica: ${validation.reason || 'sem motivo informado'}`,
      );
    }

    const points = params.points ?? this.getPointsForDifficulty(quiz.difficulty);
    const missionType = params.type ?? 'PERSONALIZADA';

    const mission = await this.prisma.$transaction(async (tx) => {
      const aiGeneration = await tx.aIGeneration.create({
        data: {
          type: 'MISSION_QUIZ',
          prompt,
          response: content,
        },
      });

      const created = await tx.mission.create({
        data: {
          title: quiz.title,
          description: quiz.question,
          type: missionType,
          points,
          startDate,
          endDate,
          createdById,
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
        include: {
          class: { select: { id: true, name: true } },
          quiz: { select: { id: true, difficulty: true } },
        },
      });
    });

    return {
      ...mission,
      hasQuiz: true,
    };
  }

  private async doGenerateDaily(apiKey: string) {
    const { startOfDay, endOfDay } = getDailyQuizDateWindow(
      new Date(),
      this.configService.get<string>('APP_TIME_ZONE'),
    );

    const existing = await this.prisma.mission.findFirst({
      where: {
        type: 'DIARIA',
        classId: null,
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
    const randomTopic = DAILY_QUIZ_TOPICS[Math.floor(Math.random() * DAILY_QUIZ_TOPICS.length)];
    const prompt = buildDailyQuizUserPrompt({
      difficulty: targetDifficulty,
      languageHint,
      suggestedTopic: randomTopic,
      recentQuizzes,
    });

    try {
      const content = await this.requestQuizGeneration(apiKey, model, prompt);
      const quiz = this.normalizeGeneratedQuiz(content, targetDifficulty);
      const validation = await this.validateGeneratedQuiz(apiKey, model, quiz);

      if (!validation.isValid || validation.correctIndex !== quiz.correctIndex) {
        this.logger.error(
          `Quiz diario rejeitado pela validacao: isValid=${validation.isValid}, ` +
            `correctIndex=${validation.correctIndex}, expected=${quiz.correctIndex}, reason="${validation.reason}"`,
        );
        return null;
      }

      const points = this.getPointsForDifficulty(quiz.difficulty);
      const mission = await this.prisma.$transaction(async (tx) => {
        const aiGeneration = await tx.aIGeneration.create({
          data: {
            type: 'QUIZ',
            prompt,
            response: content,
          },
        });

        const created = await tx.mission.create({
          data: {
            title: quiz.title,
            description: quiz.question,
            type: 'DIARIA',
            points,
            startDate: startOfDay,
            endDate: endOfDay,
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

        return created;
      });

      return {
        missionId: mission.id,
        title: quiz.title,
        question: quiz.question,
        difficulty: quiz.difficulty,
        points,
        options: quiz.options,
        answered: false,
        attempt: null,
      };
    } catch (error) {
      this.logger.error(`Falha ao gerar quiz diario: ${error}`);
      return null;
    }
  }

  private async requestQuizGeneration(apiKey: string, model: string, prompt: string) {
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

    return content;
  }

  private normalizeGeneratedQuiz(content: string, fallbackDifficulty: Difficulty): GeneratedQuiz {
    const parsed = this.parseJsonFromText(content);
    const title = String(parsed?.title || '').trim();
    const question = String(parsed?.question || '').trim();
    const options = Array.isArray(parsed?.options)
      ? parsed.options.map((option) => String(option).trim()).filter((option) => option.length > 0)
      : [];
    const explanations = Array.isArray(parsed?.explanations)
      ? parsed.explanations.map((exp) => String(exp).trim()).filter((exp) => exp.length > 0)
      : [];
    const correctIndex = Number(parsed?.correctIndex);
    const difficultyRaw = String(parsed?.difficulty || '')
      .trim()
      .toUpperCase();
    const difficulty =
      difficultyRaw === 'FACIL' || difficultyRaw === 'MEDIO' || difficultyRaw === 'DIFICIL'
        ? difficultyRaw
        : fallbackDifficulty;

    if (!title || !question || options.length !== 4 || explanations.length !== 4) {
      throw new BadRequestException(
        `Estrutura invalida no quiz gerado: title="${title}", optionsLen=${options.length}, explanationsLen=${explanations.length}`,
      );
    }

    if (title.length > 200) {
      throw new BadRequestException(`title do quiz excede 200 caracteres (${title.length})`);
    }

    if (question.length > 2000) {
      throw new BadRequestException(`question do quiz excede 2000 caracteres (${question.length})`);
    }

    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      throw new BadRequestException(`correctIndex invalido no quiz gerado: ${correctIndex}`);
    }

    return {
      title,
      question,
      difficulty,
      options,
      correctIndex,
      explanations,
    };
  }

  private async validateGeneratedQuiz(
    apiKey: string,
    model: string,
    quiz: GeneratedQuiz,
  ): Promise<{ isValid: boolean; correctIndex: number | null; reason: string }> {
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
      return { isValid: false, correctIndex: null, reason: 'Falha na chamada de validacao' };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      this.logger.error(`Validacao da IA sem conteudo: ${JSON.stringify(data)}`);
      return { isValid: false, correctIndex: null, reason: 'Resposta de validacao vazia' };
    }

    try {
      const parsed = this.parseJsonFromText(content);
      const isValid = parsed?.isValid === true;
      const validationCorrectIndex = Number(parsed?.correctIndex);
      const correctIndex = Number.isInteger(validationCorrectIndex) ? validationCorrectIndex : null;
      const reason = String(parsed?.reason || '').trim();

      return { isValid, correctIndex, reason };
    } catch {
      this.logger.error(`Falha ao fazer parse do JSON de validacao da IA: ${content}`);
      return { isValid: false, correctIndex: null, reason: 'JSON de validacao invalido' };
    }
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

  private buildAdminQuizPrompt(params: GenerateMissionQuizDto, recentQuizzes: RecentQuizSummary[]) {
    const recentBlock =
      recentQuizzes.length > 0
        ? [
            'ULTIMAS 15 QUESTOES DA PLATAFORMA (NAO REPITA tema, titulo, estrutura, codigo ou pegadinha):',
            ...recentQuizzes.map(
              (q, i) =>
                `  ${i + 1}. [${q.language ?? '?'}] ${q.title} - ${q.topic} - ${this.compactText(q.question, 180)}`,
            ),
            '',
          ].join('\n')
        : '';

    return [
      'Gere uma questao de multipla escolha para virar uma missao da plataforma AURI.',
      'A questao sera acessada por alunos na pagina de missoes, entao ela deve ser autocontida.',
      `Tema obrigatorio: ${params.theme}.`,
      `Dificuldade alvo: ${params.difficulty}.`,
      `Linguagem preferida: ${params.language?.trim() || 'escolha a mais adequada ao tema'}.`,
      `Publico alvo: ${params.audience?.trim() || 'alunos de graduacao em computacao'}.`,
      `Objetivo pedagogico: ${params.learningObjective?.trim() || 'avaliar raciocinio tecnico e entendimento conceitual'}.`,
      params.extraInstructions?.trim()
        ? `Instrucoes extras do admin: ${params.extraInstructions.trim()}.`
        : '',
      '',
      recentBlock,
      'REGRAS TECNICAS:',
      '1. Nao crie questao parecida com nenhuma das ultimas 15 questoes listadas.',
      '2. Se houver codigo que gera erro, a alternativa correta deve ser o erro real.',
      '3. Evite comportamento dependente de versao, ambiente ou implementacao. Declare versao quando isso importar.',
      '4. Exatamente uma alternativa deve estar correta.',
      '5. As alternativas incorretas devem ser plausiveis, mas inequivocamente erradas.',
      '6. A explicacao de cada alternativa deve ensinar o motivo de estar correta ou errada.',
      '7. Retorne apenas JSON valido no formato exato esperado pelo sistema.',
      '',
      'FORMATO JSON:',
      '{',
      '  "title": "Titulo curto e claro",',
      '  "question": "Enunciado completo com codigo se necessario",',
      '  "difficulty": "FACIL" | "MEDIO" | "DIFICIL",',
      '  "options": ["Alternativa 1", "Alternativa 2", "Alternativa 3", "Alternativa 4"],',
      '  "correctIndex": 0,',
      '  "explanations": ["Explicacao da 1", "Explicacao da 2", "Explicacao da 3", "Explicacao da 4"]',
      '}',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async acquireGenerationLock(lockName: string) {
    try {
      const rows = await this.prisma.$queryRaw<{ acquired: number | bigint | null }[]>(
        Prisma.sql`SELECT GET_LOCK(${lockName}, 5) AS acquired`,
      );
      return Number(rows[0]?.acquired ?? 0) === 1;
    } catch (error) {
      this.logger.warn(`Nao foi possivel adquirir lock distribuido do quiz diario: ${error}`);
      return true;
    }
  }

  private async releaseGenerationLock(lockName: string) {
    try {
      await this.prisma.$queryRaw(Prisma.sql`SELECT RELEASE_LOCK(${lockName})`);
    } catch (error) {
      this.logger.warn(`Nao foi possivel liberar lock distribuido do quiz diario: ${error}`);
    }
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

  private async getRecentQuizSummariesByCount(take: number): Promise<RecentQuizSummary[]> {
    const quizzes = await this.prisma.missionQuiz.findMany({
      select: { title: true, question: true },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return quizzes.map((q) => {
      const { language, topic } = this.summarizeQuizQuestion(q.title, q.question);
      return { title: q.title, question: q.question, topic, language };
    });
  }

  private summarizeQuizQuestion(title: string, question: string) {
    const languageMatch = question.match(/\b(Python|JavaScript|TypeScript|Java|C\+\+|C#|C(?!#|\+))\b/i);
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

  private addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private compactText(text: string, maxLength: number) {
    const compacted = text.replace(/\s+/g, ' ').trim();
    return compacted.length > maxLength ? `${compacted.slice(0, maxLength - 3)}...` : compacted;
  }
}
