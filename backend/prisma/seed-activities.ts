import {
  ActivityStatus,
  ActivityType,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const seedActivities = async () => {
  const classroom = await prisma.class.findFirst({
    where: { createdById: { not: null } },
    select: { id: true, createdById: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!classroom?.createdById) {
    console.log('No class with a teacher was found; activity seed skipped.');
    return;
  }

  const common = {
    classId: classroom.id,
    createdById: classroom.createdById,
    status: ActivityStatus.DRAFT,
    maxScore: 100,
    xpReward: 50,
    allowLateSubmissions: false,
    allowResubmission: true,
    maxAttempts: 2,
  };

  const activities = [
    {
      id: 'seed-activity-text',
      type: ActivityType.TEXT,
      title: 'Reflexão sobre lógica de programação',
      description: 'Explique com suas palavras como estruturas condicionais alteram o fluxo de um programa.',
    },
    {
      id: 'seed-activity-file',
      type: ActivityType.FILE,
      title: 'Diagrama de fluxo',
      description: 'Envie um PDF ou uma imagem com o diagrama de fluxo da solução proposta.',
    },
    {
      id: 'seed-activity-quiz',
      type: ActivityType.QUIZ,
      title: 'Questionário de fundamentos',
      description: 'Responda às questões objetivas sobre fundamentos de programação.',
    },
    {
      id: 'seed-activity-code',
      type: ActivityType.CODE,
      title: 'Soma de dois números',
      description: 'Implemente uma solução que leia dois números e retorne a soma.',
    },
  ];

  for (const activity of activities) {
    await prisma.activity.upsert({
      where: { id: activity.id },
      update: { ...common, ...activity },
      create: { ...common, ...activity },
    });
  }

  await prisma.activityQuestion.upsert({
    where: { id: 'seed-question-fundamentals' },
    update: {
      activityId: 'seed-activity-quiz',
      type: QuestionType.MULTIPLE_CHOICE,
      prompt: 'Qual estrutura é usada para tomar decisões em um programa?',
      points: 100,
      position: 1,
    },
    create: {
      id: 'seed-question-fundamentals',
      activityId: 'seed-activity-quiz',
      type: QuestionType.MULTIPLE_CHOICE,
      prompt: 'Qual estrutura é usada para tomar decisões em um programa?',
      points: 100,
      position: 1,
    },
  });

  const options = [
    ['seed-option-if', 'Estrutura condicional', true],
    ['seed-option-loop', 'Laço de repetição', false],
    ['seed-option-comment', 'Comentário', false],
    ['seed-option-import', 'Importação de módulo', false],
  ] as const;

  for (const [index, [id, text, isCorrect]] of options.entries()) {
    await prisma.questionOption.upsert({
      where: { id },
      update: {
        questionId: 'seed-question-fundamentals',
        text,
        isCorrect,
        position: index + 1,
      },
      create: {
        id,
        questionId: 'seed-question-fundamentals',
        text,
        isCorrect,
        position: index + 1,
      },
    });
  }

  console.log('Seeded TEXT, FILE, QUIZ and CODE activity drafts.');
};

seedActivities()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
