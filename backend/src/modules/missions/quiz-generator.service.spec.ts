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

    await expect(service.generateDailyQuizMission()).resolves.toMatchObject({ missionId: 'mission-1' });

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

    await service.generateDailyQuizMission();

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

    await service.generateDailyQuizMission();

    expect(aIGenerationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ inputTokens: null, outputTokens: null, totalTokens: null }),
    });
  });

  it('stops after the maximum of three rejected attempts and persists no rejected generation', async () => {
    const { service, aIGenerationCreate } = createService();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      fetchMock
        .mockResolvedValueOnce(response(quizContent(`Quiz rejeitado ${attempt}`), { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }))
        .mockResolvedValueOnce(response(validationContent(false), { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }));
    }

    await expect(service.generateDailyQuizMission()).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(aIGenerationCreate).not.toHaveBeenCalled();
  });
});
