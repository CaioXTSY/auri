import { ConfigService } from '@nestjs/config';
import { QuizGeneratorService } from './quiz-generator.service';

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

const response = (content: string, usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) => ({
  ok: true,
  json: jest.fn().mockResolvedValue({ choices: [{ message: { content } }], ...(usage ? { usage } : {}) }),
  text: jest.fn(),
});

const createService = () => {
  const aIGenerationCreate = jest.fn().mockResolvedValue({ id: 'generation-1' });
  const missionCreate = jest.fn().mockResolvedValue({ id: 'mission-1', points: 85 });
  const tx = {
    mission: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: missionCreate,
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
  const config = { get: jest.fn((key: string) => ({
    OPENAI_API_KEY: 'test-key',
    OPENAI_MODEL: 'test-model',
    APP_TIME_ZONE: 'America/Sao_Paulo',
  })[key]) };

  return {
    service: new QuizGeneratorService(prisma as never, config as unknown as ConfigService),
    aIGenerationCreate,
    prisma,
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
      .mockResolvedValueOnce(response(quizContent('Quiz aprovado'), { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }))
      .mockResolvedValueOnce(response(validationContent(true), { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 }));

    await expect(service.generateReviewedQuiz({ difficulty: 'MEDIO' })).resolves.toMatchObject({ quiz: { title: 'Quiz aprovado' } });

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
      .mockResolvedValueOnce(response(rejected, { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 }))
      .mockResolvedValueOnce(response(validationContent(false), { prompt_tokens: 4, completion_tokens: 1, total_tokens: 5 }))
      .mockResolvedValueOnce(response(approved, { prompt_tokens: 12, completion_tokens: 3, total_tokens: 15 }))
      .mockResolvedValueOnce(response(validationContent(true), { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 }));

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
        .mockResolvedValueOnce(response(quizContent(`Quiz rejeitado ${attempt}`), { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }))
        .mockResolvedValueOnce(response(validationContent(false), { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }));
    }

    await expect(service.generateReviewedQuiz({ difficulty: 'MEDIO' })).resolves.toMatchObject({ quiz: null });

    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(aIGenerationCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ status: 'REJECTED', totalTokens: 12, generationAttempts: 3, validationCalls: 3 }) });
  });

  it.each([
    [0, 'FACIL'], [10, 'MEDIO'], [20, 'DIFICIL'],
  ])('selects actual daily difficulty for %i correct answers out of 20', async (correct, expected) => {
    const { service, prisma } = createService();
    prisma.missionQuizAttempt.findMany.mockResolvedValue(Array.from({ length: 20 }, (_, i) => ({ isCorrect: i < Number(correct) })));
    const target = service as unknown as { getTargetDailyDifficulty(): Promise<string> };
    expect(await target.getTargetDailyDifficulty()).toBe(expected);
  });

  it('blocks evaluation against a nonlocal or non-evaluation database before calling OpenAI', async () => {
    const { service } = createService();
    await expect(service.generateEvaluationQuiz({ difficulty: 'FACIL', topic: 'variáveis', language: 'Python' })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a repeated question before semantic review and records all generation costs', async () => {
    const { service, prisma, aIGenerationCreate } = createService();
    prisma.missionQuiz.findMany.mockResolvedValue([{ title: 'Previous', question: 'Em JavaScript, qual valor esta correto?' }]);
    for (let i = 0; i < 3; i++) fetchMock.mockResolvedValueOnce(response(quizContent('Repeated'), { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }));
    await expect(service.generateReviewedQuiz({ difficulty: 'MEDIO' })).resolves.toMatchObject({ quiz: null });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(aIGenerationCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ status: 'REJECTED', totalTokens: 6, validationCalls: 0 }) });
  });
});
