import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Difficulty } from '@prisma/client';

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
      this.logger.warn('OPENAI_API_KEY não configurada — geração de quiz diário ignorada');
      return null;
    }

    if (this.generationLock) {
      this.logger.log('Geração de quiz diário já em andamento, ignorando requisição duplicada');
      return null;
    }
    this.generationLock = true;

    try {
      return await this.doGenerate(apiKey);
    } finally {
      this.generationLock = false;
    }
  }

  private async doGenerate(apiKey: string) {
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
      '"options": ["Texto completo da alternativa 1", "Texto completo da alternativa 2", "Texto completo da alternativa 3", "Texto completo da alternativa 4"],',
      '"correctIndex": 0,',
      '"explanations": ["Por que a alternativa 1 está correta ou errada", "Por que a alternativa 2 está correta ou errada", "Por que a alternativa 3 está correta ou errada", "Por que a alternativa 4 está correta ou errada"]',
      '}',
      'REGRAS DE FORMATAÇÃO:',
      '- Exatamente 4 alternativas, cada uma com o texto completo da resposta (nunca apenas "A", "B", "C" ou "D").',
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
      this.logger.error(`Falha na API OpenAI (${response.status}): ${text}`);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      this.logger.error(`Resposta da IA sem conteúdo: ${JSON.stringify(data)}`);
      return null;
    }

    let parsed: any;
    try {
      parsed = this.parseJsonFromText(content);
    } catch {
      this.logger.error(`Falha ao fazer parse do JSON retornado pela IA: ${content}`);
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
      this.logger.error(`Estrutura inválida no quiz gerado — campos ausentes ou array com tamanho errado: title="${title}", optionsLen=${options.length}, explanationsLen=${explanations.length}`);
      return null;
    }

    if (title.length > 200) {
      this.logger.error(`title do quiz excede 200 caracteres (${title.length})`);
      return null;
    }

    if (question.length > 2000) {
      this.logger.error(`question do quiz excede 2000 caracteres (${question.length})`);
      return null;
    }

    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      this.logger.error(`correctIndex inválido no quiz gerado: ${correctIndex}`);
      return null;
    }

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
      select: { isCorrect: true },
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
}
