import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Difficulty } from '@prisma/client';
import * as request from 'supertest';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/modules/mail/mail.service';
import { QuizGeneratorService } from '../src/modules/missions/quiz-generator.service';
import { MissionQuizService } from '../src/modules/missions/mission-quiz.service';
import { MissionsSchedulerService } from '../src/modules/missions/missions-scheduler.service';
import { getDailyQuizDateWindow } from '../src/modules/missions/daily-quiz-date';

describe('Automatic daily quiz: real API, pipeline and isolated database; OpenAI mocked', () => {
  let app: INestApplication,
    prisma: PrismaService,
    config: ConfigService,
    generator: QuizGeneratorService;
  let student: string, token: string;
  const legacyIds: string[] = [];
  const checks: Array<{ scenario: string; expected: unknown; obtained: unknown }> = [];
  const record = (scenario: string, expected: unknown, obtained: unknown) => {
    checks.push({ scenario, expected, obtained });
    expect(obtained).toEqual(expected);
  };
  let invalidCandidates = 0,
    invalidReviews = 0;
  let generationCalls = 0;
  const rawQuiz = (difficulty: Difficulty) => ({
    title: 'Synthetic automatic sum',
    question: 'Em JavaScript, qual saída de console.log(2 + 2)?',
    difficulty,
    options: ['1', '2', '4', '5'],
    correctIndex: 2,
    explanations: [
      'Um não é a soma.',
      'Dois não é a soma.',
      'Dois mais dois é quatro.',
      'Cinco não é a soma.',
    ],
  });

  beforeAll(async () => {
    config = new ConfigService({
      ...process.env,
      OPENAI_API_KEY: 'synthetic-openai-key',
      OPENAI_MODEL: 'synthetic-generator',
      OPENAI_REVIEW_MODEL: 'synthetic-reviewer',
      QUIZ_GENERATION_ENABLED: 'true',
      QUIZ_REVIEW_MODE: 'human',
      APP_TIME_ZONE: 'America/Sao_Paulo',
    });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(config)
      .overrideProvider(MailService)
      .useValue({ sendPasswordResetEmail: jest.fn() })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    generator = app.get(QuizGeneratorService);
    const user = await prisma.user.create({
      data: {
        name: 'Synthetic automatic student',
        email: `automatic-${Date.now()}@example.invalid`,
        password: 'unused-synthetic',
        role: 'ALUNO',
      },
    });
    student = user.id;
    token = app.get(JwtService).sign({ sub: student, email: user.email, role: 'ALUNO' });
  });

  beforeEach(() => {
    invalidCandidates = 0;
    invalidReviews = 0;
    generationCalls = 0;
    jest.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      if (String(url) !== 'https://api.openai.com/v1/chat/completions')
        throw new Error('Unexpected fetch');
      const payload = JSON.parse(String(init?.body));
      const generation = payload.response_format.type === 'json_schema';
      let content: string;
      if (generation) {
        generationCalls++;
        const difficulty = payload.messages[1].content.match(
          /Nível alvo: (FACIL|MEDIO|DIFICIL)/,
        )?.[1];
        if (!difficulty) throw new Error('Requested difficulty missing from prompt');
        content =
          generationCalls <= invalidCandidates
            ? '{invalid'
            : JSON.stringify(rawQuiz(difficulty as Difficulty));
      } else {
        const isValid = invalidReviews-- <= 0;
        content = JSON.stringify({
          isValid,
          correctIndex: 2,
          reason: isValid ? '' : 'Synthetic semantic rejection',
        });
      }
      return new Response(
        JSON.stringify({
          model: generation ? 'synthetic-generator' : 'synthetic-reviewer',
          choices: [{ message: { content } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
        { status: 200, headers: { 'x-request-id': `synthetic-${Date.now()}` } },
      );
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    const current = await prisma.mission.findMany({
      where: {
        OR: [
          { quiz: { is: { aiGeneration: { is: { model: 'synthetic-generator' } } } } },
          { id: { in: legacyIds } },
        ],
      },
      select: { id: true },
    });
    await prisma.mission.deleteMany({ where: { id: { in: current.map((m) => m.id) } } });
    await prisma.aIGeneration.deleteMany({ where: { model: 'synthetic-generator' } });
    await prisma.userPoint.deleteMany({ where: { userId: student } });
  });

  afterAll(async () => {
    if (prisma && student) await prisma.user.delete({ where: { id: student } });
    const dir = resolve(process.env.TCC_EVIDENCE_DIR || '../../logs/quiz-automatic');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'quiz-automatic-resultados.json'), JSON.stringify(checks, null, 2));
    if (app) await app.close();
  });

  const daily = () =>
    request(app.getHttpServer())
      .get('/api/v1/missions/daily-quiz/me')
      .set('Authorization', `Bearer ${token}`);

  it('publishes through the actual pipeline, hides the key, preserves pairs and awards XP once concurrently', async () => {
    const result = await daily().expect(200);
    const mission = await prisma.mission.findUniqueOrThrow({
      where: { id: result.body.missionId },
      include: { quiz: true },
    });
    const quiz = mission.quiz!;
    record(
      'Automatic publication despite legacy human setting',
      { status: 'APPROVED', reviewer: null },
      { status: quiz.reviewStatus, reviewer: quiz.reviewedById },
    );
    record(
      'Hidden key before answering',
      { key: false, explanations: false },
      { key: 'correctIndex' in result.body, explanations: 'explanations' in result.body },
    );
    const original = rawQuiz(quiz.difficulty);
    record(
      'Stored option-explanation pairs and key preserved',
      true,
      (quiz.options as string[]).every(
        (option, i) =>
          (quiz.explanations as string[])[i] ===
          original.explanations[original.options.indexOf(option)],
      ) && (quiz.options as string[])[quiz.correctIndex] === '4',
    );
    const answer = () =>
      request(app.getHttpServer())
        .post(`/api/v1/missions/${mission.id}/quiz/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send({ selectedIndex: quiz.correctIndex });
    const answers = await Promise.all([answer(), answer()]);
    record('Concurrent correct answers', [201, 400], answers.map((r) => r.status).sort());
    const points = await prisma.userPoint.aggregate({
      where: { userId: student },
      _sum: { points: true },
    });
    record('Daily XP credited once', mission.points, points._sum.points);
    record(
      'Daily reward ledger entries',
      1,
      await prisma.userPoint.count({
        where: { userId: student, source: 'MISSAO', referenceId: mission.id },
      }),
    );
    const repeated = await daily().expect(200);
    expect(repeated.body.answered).toBe(true);
    expect(repeated.body.correctIndex).toBe(quiz.correctIndex);
    expect(generationCalls).toBe(1);
  });

  it('retries invalid JSON and publishes only the later validated candidate with complete audit', async () => {
    invalidCandidates = 1;
    expect(await generator.generateDailyQuizMission()).not.toBeNull();
    const audit = await prisma.aIGeneration.findFirstOrThrow({
      where: { model: 'synthetic-generator' },
    });
    record(
      'Invalid candidate followed by valid publication',
      { attempts: 2, reviews: 1, calls: 3, status: 'VALIDATED' },
      {
        attempts: audit.generationAttempts,
        reviews: audit.validationCalls,
        calls: (audit.callAudit as unknown[]).length,
        status: audit.status,
      },
    );
    expect(
      await prisma.missionQuiz.count({
        where: { reviewStatus: 'PENDING', aiGenerationId: audit.id },
      }),
    ).toBe(0);
  });

  it('retries an AI reviewer rejection without sending the decision to a human queue', async () => {
    invalidReviews = 1;
    expect(await generator.generateDailyQuizMission()).not.toBeNull();
    const audit = await prisma.aIGeneration.findFirstOrThrow({
      where: { model: 'synthetic-generator' },
    });
    record(
      'AI rejection followed by automatic approval',
      { attempts: 2, reviews: 2, status: 'APPROVED' },
      {
        attempts: audit.generationAttempts,
        reviews: audit.validationCalls,
        status: (await prisma.missionQuiz.findFirstOrThrow({ where: { aiGenerationId: audit.id } }))
          .reviewStatus,
      },
    );
  });

  it('returns an appropriate unavailability message after three invalid attempts and creates no pending quiz', async () => {
    invalidCandidates = 3;
    jest
      .spyOn(
        app.get(MissionQuizService) as unknown as { sleep(ms: number): Promise<void> },
        'sleep',
      )
      .mockResolvedValue();
    const unavailable = await daily().expect(404);
    expect(unavailable.body.message).toContain('quiz diário válido');
    expect(unavailable.body.message).not.toMatch(/humana|aprovação|professor|administrador/i);
    const audit = await prisma.aIGeneration.findFirstOrThrow({
      where: { model: 'synthetic-generator' },
    });
    record(
      'Exhausted retries publish nothing',
      { attempts: 3, calls: 3, tokens: 45, quizzes: 0, status: 'REJECTED' },
      {
        attempts: audit.generationAttempts,
        calls: (audit.callAudit as unknown[]).length,
        tokens: audit.totalTokens,
        quizzes: await prisma.missionQuiz.count({ where: { aiGenerationId: audit.id } }),
        status: audit.status,
      },
    );
  });

  it.each(['PENDING', 'AUTO_REJECTED', 'REJECTED'])(
    'archives the occupied daily slot without publishing historical %s content under concurrent generation',
    async (status) => {
      const { startOfDay, dayKey } = getDailyQuizDateWindow(new Date(), 'America/Sao_Paulo');
      const historical = await prisma.mission.create({
        data: {
          title: 'Historical unpublished',
          description: 'Preserve this original',
          type: 'DIARIA',
          dailyKey: dayKey,
          startDate: startOfDay,
          endDate: new Date('2099-12-31'),
          points: 40,
          quiz: {
            create: {
              ...rawQuiz('FACIL'),
              question: 'Historical original content',
              reviewStatus: status,
            },
          },
        },
        include: { quiz: true },
      });
      legacyIds.push(historical.id);
      const instances = [
        new QuizGeneratorService(prisma, config),
        new QuizGeneratorService(prisma, config),
      ];
      await Promise.all(instances.map((instance) => instance.generateDailyQuizMission()));
      const saved = await prisma.mission.findMany({
        where: { dailyKey: dayKey },
        include: { quiz: true },
      });
      record(
        `Replacement of historical ${status}: one automatic publication`,
        { count: 1, status: 'APPROVED' },
        { count: saved.length, status: saved[0]?.quiz?.reviewStatus },
      );
      const archived = await prisma.mission.findUniqueOrThrow({
        where: { id: historical.id },
        include: { quiz: true },
      });
      expect(archived.quiz).toEqual(historical.quiz);
      record(
        `Historical ${status} remains unchanged and releases only its daily slot`,
        { status, dailyKey: null },
        { status: archived.quiz?.reviewStatus, dailyKey: archived.dailyKey },
      );
      await request(app.getHttpServer())
        .get(`/api/v1/missions/${historical.id}/quiz`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      const available = await daily().expect(200);
      expect(available.body.missionId).toBe(saved[0].id);
    },
  );

  it('serves an already published legacy daily quiz without regeneration or human action', async () => {
    const { startOfDay } = getDailyQuizDateWindow(new Date(), 'America/Sao_Paulo');
    const historical = await prisma.mission.create({
      data: {
        title: 'Legacy published',
        description: 'Synthetic legacy',
        type: 'DIARIA',
        startDate: startOfDay,
        endDate: new Date('2099-12-31'),
        points: 40,
        quiz: { create: { ...rawQuiz('FACIL'), reviewStatus: 'APPROVED' } },
      },
    });
    legacyIds.push(historical.id);
    const available = await daily().expect(200);
    record(
      'Legacy published quiz served without regeneration',
      historical.id,
      available.body.missionId,
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('the existing scheduler publishes a quiz immediately available to the student', async () => {
    await app.get(MissionsSchedulerService).generateDailyMission();
    const available = await daily().expect(200);
    record(
      'Scheduled quiz available without human review',
      'APPROVED',
      (
        await prisma.missionQuiz.findUniqueOrThrow({
          where: { missionId: available.body.missionId },
        })
      ).reviewStatus,
    );
    expect(generationCalls).toBe(1);
  });
});
