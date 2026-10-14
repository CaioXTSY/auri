import { ConfigService } from '@nestjs/config';
import { QuizGeneratorService } from './quiz-generator.service';
import { MissionsSchedulerService } from './missions-scheduler.service';

const quizContent = (title: string) =>
  JSON.stringify({
    title,
    question: 'Em JavaScript, qual valor esta correto?',
    difficulty: 'MEDIO',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 1,
    explanations: ['x', 'y', 'z', 'w'],
  });

const validationContent = (isValid: boolean) =>
  JSON.stringify({ isValid, correctIndex: 1, reason: isValid ? '' : 'Alternativa inconsistente' });

const response = (
  content: string,
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
) => ({
  ok: true,
  json: jest
    .fn()
    .mockResolvedValue({ choices: [{ message: { content } }], ...(usage ? { usage } : {}) }),
  text: jest.fn(),
});

const createService = (overrides: Record<string, string> = {}) => {
  const aIGenerationCreate = jest.fn().mockResolvedValue({ id: 'generation-1' });
  const missionCreate = jest.fn().mockImplementation(({ data }) =>
    Promise.resolve({
      id: 'mission-1',
      points: data.points,
      quiz: data.quiz.create,
    }),
  );
  const tx = {
    mission: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: missionCreate,
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'mission-1',
        points: 85,
        quiz: {
          title: 'Quiz aprovado',
          question: 'Em JavaScript, qual valor esta correto?',
          difficulty: 'MEDIO',
          options: ['A', 'B', 'C', 'D'],
        },
      }),
    },
    aIGeneration: { create: aIGenerationCreate },
    missionQuiz: { create: jest.fn().mockResolvedValue({ id: 'quiz-1' }) },
  };
  const prisma = {
    aIGeneration: { create: aIGenerationCreate },
    mission: { findFirst: jest.fn().mockResolvedValue(null) },
    missionQuiz: { findMany: jest.fn().mockResolvedValue([]) },
    missionQuizAttempt: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
  };
  const config = {
    get: jest.fn(
      (key: string) =>
        ({
          OPENAI_API_KEY: 'test-key',
          OPENAI_MODEL: 'test-model',
          APP_TIME_ZONE: 'America/Sao_Paulo',
          ...overrides,
        })[key],
    ),
  };

  return {
    service: new QuizGeneratorService(prisma as never, config as unknown as ConfigService),
    aIGenerationCreate,
    prisma,
    tx,
  };
};

describe('QuizGeneratorService usage metrics', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fetchMock.mockReset();
  });

  it('persists the approved first attempt and the aggregate generation and validation usage', async () => {
    const { service, aIGenerationCreate } = createService();
    fetchMock
      .mockResolvedValueOnce(
        response(quizContent('Quiz aprovado'), {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        }),
      )
      .mockResolvedValueOnce(
        response(validationContent(true), {
          prompt_tokens: 7,
          completion_tokens: 3,
          total_tokens: 10,
        }),
      );

    await expect(service.generateReviewedQuiz({ difficulty: 'MEDIO' })).resolves.toMatchObject({
      quiz: { title: 'Quiz aprovado' },
    });

    expect(aIGenerationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        model: 'test-model',
        inputTokens: 17,
        outputTokens: 8,
        totalTokens: 25,
        generationAttempts: 1,
        validationCalls: 1,
        response: quizContent('Quiz aprovado'),
      }),
    });
  });

  it('aggregates rejected and approved calls but persists only the approved prompt and response', async () => {
    const { service, aIGenerationCreate } = createService();
    const rejected = quizContent('Quiz rejeitado');
    const approved = quizContent('Quiz aprovado');
    fetchMock
      .mockResolvedValueOnce(
        response(rejected, { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 }),
      )
      .mockResolvedValueOnce(
        response(validationContent(false), {
          prompt_tokens: 4,
          completion_tokens: 1,
          total_tokens: 5,
        }),
      )
      .mockResolvedValueOnce(
        response(approved, { prompt_tokens: 12, completion_tokens: 3, total_tokens: 15 }),
      )
      .mockResolvedValueOnce(
        response(validationContent(true), {
          prompt_tokens: 5,
          completion_tokens: 2,
          total_tokens: 7,
        }),
      );

    await service.generateReviewedQuiz({ difficulty: 'MEDIO' });

    const persisted = aIGenerationCreate.mock.calls[0][0].data;
    expect(persisted).toMatchObject({
      inputTokens: 31,
      outputTokens: 8,
      totalTokens: 39,
      generationAttempts: 2,
      validationCalls: 2,
      response: approved,
    });
    expect(persisted.response).not.toContain('Quiz rejeitado');
    expect(persisted.prompt).not.toContain('Quiz rejeitado');
  });

  it('keeps token metrics unavailable when an OpenAI response omits usage', async () => {
    const { service, aIGenerationCreate } = createService();
    fetchMock
      .mockResolvedValueOnce(response(quizContent('Quiz aprovado')))
      .mockResolvedValueOnce(response(validationContent(true)));

    await service.generateReviewedQuiz({ difficulty: 'MEDIO' });

    expect(aIGenerationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ inputTokens: null, outputTokens: null, totalTokens: null }),
    });
  });

  it('stops after three rejections, audits failed costs and creates no usable quiz', async () => {
    const { service, aIGenerationCreate } = createService();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      fetchMock
        .mockResolvedValueOnce(
          response(quizContent(`Quiz rejeitado ${attempt}`), {
            prompt_tokens: 1,
            completion_tokens: 1,
            total_tokens: 2,
          }),
        )
        .mockResolvedValueOnce(
          response(validationContent(false), {
            prompt_tokens: 1,
            completion_tokens: 1,
            total_tokens: 2,
          }),
        );
    }

    await expect(service.generateReviewedQuiz({ difficulty: 'MEDIO' })).resolves.toMatchObject({
      quiz: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(aIGenerationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'REJECTED',
        totalTokens: 12,
        generationAttempts: 3,
        validationCalls: 3,
      }),
    });
  });

  it.each([
    [0, 'FACIL'],
    [10, 'MEDIO'],
    [20, 'DIFICIL'],
  ])(
    'selects actual daily difficulty for %i correct answers out of 20',
    async (correct, expected) => {
      const { service, prisma } = createService();
      prisma.missionQuizAttempt.findMany.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ isCorrect: i < Number(correct) })),
      );
      const target = service as unknown as { getTargetDailyDifficulty(): Promise<string> };
      expect(await target.getTargetDailyDifficulty()).toBe(expected);
    },
  );

  it('blocks evaluation against a nonlocal or non-evaluation database before calling OpenAI', async () => {
    const { service } = createService();
    await expect(
      service.generateEvaluationQuiz({
        difficulty: 'FACIL',
        topic: 'variáveis',
        language: 'Python',
      }),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a repeated question before semantic review and records all generation costs', async () => {
    const { service, prisma, aIGenerationCreate } = createService();
    prisma.missionQuiz.findMany.mockResolvedValue([
      { title: 'Previous', question: 'Em JavaScript, qual valor esta correto?' },
    ]);
    for (let i = 0; i < 3; i++)
      fetchMock.mockResolvedValueOnce(
        response(quizContent('Repeated'), {
          prompt_tokens: 1,
          completion_tokens: 1,
          total_tokens: 2,
        }),
      );
    await expect(service.generateReviewedQuiz({ difficulty: 'MEDIO' })).resolves.toMatchObject({
      quiz: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(aIGenerationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'REJECTED', totalTokens: 6, validationCalls: 0 }),
    });
  });

  it.each([undefined, 'automatic', 'human'])(
    'publishes a validated daily quiz without human approval (legacy setting %s)',
    async (mode) => {
      const { service, tx } = createService(mode ? { QUIZ_REVIEW_MODE: mode } : {});
      jest
        .spyOn(
          service as unknown as { getTargetDailyDifficulty(): Promise<string> },
          'getTargetDailyDifficulty',
        )
        .mockResolvedValue('MEDIO');
      fetchMock
        .mockResolvedValueOnce(response(quizContent('Daily valid')))
        .mockResolvedValueOnce(response(validationContent(true)));
      const published = await service.generateDailyQuizMission();
      expect(published).toMatchObject({ missionId: 'mission-1', answered: false });
      expect(published).not.toHaveProperty('correctIndex');
      expect(published).not.toHaveProperty('explanations');
      expect(tx.mission.create.mock.calls[0][0].data.quiz.create).toMatchObject({
        reviewStatus: 'APPROVED',
        reviewReason: expect.stringContaining('validação automatizada'),
      });
    },
  );

  it('retries invalid JSON, then publishes only the validated candidate', async () => {
    const { service, tx, aIGenerationCreate } = createService();
    jest
      .spyOn(
        service as unknown as { getTargetDailyDifficulty(): Promise<string> },
        'getTargetDailyDifficulty',
      )
      .mockResolvedValue('MEDIO');
    fetchMock
      .mockResolvedValueOnce(response('{invalid'))
      .mockResolvedValueOnce(response(quizContent('Valid second candidate')))
      .mockResolvedValueOnce(response(validationContent(true)));
    expect(await service.generateDailyQuizMission()).toMatchObject({ missionId: 'mission-1' });
    expect(tx.mission.create).toHaveBeenCalledTimes(1);
    expect(aIGenerationCreate.mock.calls[0][0].data).toMatchObject({
      status: 'VALIDATED',
      generationAttempts: 2,
      validationCalls: 1,
    });
  });

  it('creates no daily mission or human pending record when all three candidates are invalid', async () => {
    const { service, tx, aIGenerationCreate } = createService();
    fetchMock.mockResolvedValue(
      response('{invalid', { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 }),
    );
    expect(await service.generateDailyQuizMission()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(tx.mission.create).not.toHaveBeenCalled();
    expect(tx.missionQuiz.create).not.toHaveBeenCalled();
    expect(aIGenerationCreate.mock.calls[0][0].data).toMatchObject({
      status: 'REJECTED',
      totalTokens: 9,
      generationAttempts: 3,
    });
  });

  it('the existing scheduler publishes through the same automated pipeline', async () => {
    const { service, tx } = createService();
    jest
      .spyOn(
        service as unknown as { getTargetDailyDifficulty(): Promise<string> },
        'getTargetDailyDifficulty',
      )
      .mockResolvedValue('MEDIO');
    fetchMock
      .mockResolvedValueOnce(response(quizContent('Scheduled valid quiz')))
      .mockResolvedValueOnce(response(validationContent(true)));
    await new MissionsSchedulerService(service).generateDailyMission();
    expect(tx.mission.create.mock.calls[0][0].data.quiz.create.reviewStatus).toBe('APPROVED');
  });

  it('shares one generation promise for simultaneous requests to the same instance', async () => {
    const { service, tx } = createService();
    jest
      .spyOn(
        service as unknown as { getTargetDailyDifficulty(): Promise<string> },
        'getTargetDailyDifficulty',
      )
      .mockResolvedValue('MEDIO');
    fetchMock
      .mockResolvedValueOnce(response(quizContent('Concurrent valid quiz')))
      .mockResolvedValueOnce(response(validationContent(true)));
    const results = await Promise.all([
      service.generateDailyQuizMission(),
      service.generateDailyQuizMission(),
    ]);
    expect(results[0]).toEqual(results[1]);
    expect(tx.mission.create).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
