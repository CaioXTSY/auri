import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, CodeSubmissionStatus } from '@prisma/client';
import * as request from 'supertest';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GamificationService } from '../src/modules/gamification/gamification.service';
import { ProgrammingGamificationService } from '../src/modules/programming/programming-gamification.service';
import { ActivitiesService } from '../src/modules/activities/activities.service';
import { lockRewardUser, awardOnce } from '../src/modules/gamification/reward-store';
import { MailService } from '../src/modules/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { QuizGeneratorService } from '../src/modules/missions/quiz-generator.service';
import { getDailyQuizDateWindow } from '../src/modules/missions/daily-quiz-date';

describe('TCC real isolated database and API validation', () => {
  let app: INestApplication, prisma: PrismaService, gamification: GamificationService;
  const users: string[] = [],
    missions: string[] = [],
    classes: string[] = [],
    achievements: string[] = [];
  let student: string, peer: string, teacher: string, admin: string, classroom: string;
  let studentToken: string, adminToken: string, teacherToken: string;
  const evidence: Array<{ scenario: string; expected: unknown; obtained: unknown }> = [];
  const record = (scenario: string, expected: unknown, obtained: unknown) => {
    evidence.push({ scenario, expected, obtained });
    expect(obtained).toEqual(expected);
  };
  const mission = async (quiz = false, pending = false, classId: string | null = null) => {
    const value = await prisma.mission.create({
      data: {
        title: 'TCC synthetic mission',
        description: 'Synthetic test',
        points: 5,
        type: 'PERSONALIZADA',
        startDate: new Date(Date.now() - 60000),
        endDate: new Date('2099-12-31'),
        createdById: teacher,
        classId,
        ...(quiz
          ? {
              quiz: {
                create: {
                  title: 'Soma sintética',
                  question: 'Quanto é 2 + 2?',
                  difficulty: 'FACIL',
                  options: ['1', '2', '4', '5'],
                  explanations: [
                    'Não é a soma.',
                    'Não é a soma.',
                    'A soma é quatro.',
                    'Não é a soma.',
                  ],
                  correctIndex: 2,
                  reviewStatus: pending ? 'PENDING' : 'APPROVED',
                },
              },
            }
          : {}),
      },
      include: { quiz: true },
    });
    missions.push(value.id);
    return value;
  };

  beforeAll(async () => {
    if (
      !process.env.DATABASE_URL?.match(
        /^mysql:\/\/[^@]*@(?:127\.0\.0\.1|localhost):\d+\/auri_tcc_[a-z0-9_]+$/,
      )
    )
      throw new Error('Explicit isolated auri_tcc_* database required');
    if (process.env.QUIZ_GENERATION_ENABLED !== 'false')
      throw new Error('Disable real generation for deterministic API tests');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined) })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    gamification = app.get(GamificationService);
    for (const role of [Role.ALUNO, Role.ALUNO, Role.PROFESSOR, Role.ADMIN]) {
      const user = await prisma.user.create({
        data: {
          name: `Synthetic ${role}`,
          email: `tcc-${Date.now()}-${users.length}@example.invalid`,
          password: 'unused-synthetic',
          role,
        },
      });
      users.push(user.id);
    }
    [student, peer, teacher, admin] = users;
    const jwt = app.get(JwtService);
    studentToken = jwt.sign({ sub: student, email: 'synthetic@example.invalid', role: 'ALUNO' });
    adminToken = jwt.sign({ sub: admin, email: 'synthetic@example.invalid', role: 'ADMIN' });
    teacherToken = jwt.sign({
      sub: teacher,
      email: 'synthetic@example.invalid',
      role: 'PROFESSOR',
    });
    const c = await prisma.class.create({
      data: { name: 'TCC isolated class', year: 2026, createdById: teacher },
    });
    classroom = c.id;
    classes.push(c.id);
    await prisma.classStudent.create({ data: { classId: classroom, userId: student } });
    // Simulate a historical enrollment whose user was later promoted to staff.
    await prisma.classStudent.create({ data: { classId: classroom, userId: admin } });
    await prisma.classJoinRequest.create({
      data: { classId: classroom, userId: peer, status: 'PENDING' },
    });
  }, 30000);
  afterAll(async () => {
    if (prisma) {
      await prisma.mission.deleteMany({ where: { id: { in: missions } } });
      await prisma.class.deleteMany({ where: { id: { in: classes } } });
      await prisma.achievement.deleteMany({ where: { id: { in: achievements } } });
      await prisma.user.deleteMany({ where: { id: { in: users } } });
      const dir = process.env.TCC_EVIDENCE_DIR
        ? resolve(process.env.TCC_EVIDENCE_DIR)
        : resolve(__dirname, '../../evidencias-tcc');
      mkdirSync(dir, { recursive: true });
      writeFileSync(resolve(dir, 'integracao-resultados.json'), JSON.stringify(evidence, null, 2));
    }
    if (app) await app.close();
  });

  it('counts one enrolled student, includes owner only in participants, excludes pending enrollment', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/classes/${classroom}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    record('Enrolled student count', 1, response.body.students.length);
    const participants = await request(app.getHttpServer())
      .get(`/api/v1/classes/${classroom}/students`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    record(
      'Participants vs students',
      { participants: 2, students: 1, owners: 1 },
      {
        participants: participants.body.length,
        students: participants.body.filter(
          (m: { membershipType: string }) => m.membershipType === 'STUDENT',
        ).length,
        owners: participants.body.filter(
          (m: { membershipType: string }) => m.membershipType === 'OWNER',
        ).length,
      },
    );
  });

  it('keeps XP and both persisted rankings at 475, 480, 485, with no repeated mission or quiz credit', async () => {
    await gamification.addPoints(student, 475, 'TCC_BASE', 'Synthetic baseline');
    const totals = async () => ({
      xp: await gamification.getUserTotalPoints(student),
      global: (await gamification.getUserRankingPosition(student, 'GLOBAL'))?.points,
      classroom: (await gamification.getUserRankingPosition(student, 'TURMA', classroom))?.points,
    });
    record('Initial XP/rankings', { xp: 475, global: 475, classroom: 475 }, await totals());
    const m = await mission(false, false, classroom);
    await request(app.getHttpServer())
      .post(`/api/v1/missions/${m.id}/start`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);
    const completions = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post(`/api/v1/missions/${m.id}/complete`)
          .set('Authorization', `Bearer ${studentToken}`),
      ),
    );
    record(
      'Concurrent mission completion statuses',
      [201, 400],
      completions.map((r) => r.status).sort(),
    );
    record('Mission XP/rankings', { xp: 480, global: 480, classroom: 480 }, await totals());
    const q = await mission(true, false, classroom);
    const before = await request(app.getHttpServer())
      .get(`/api/v1/missions/${q.id}/quiz`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    record(
      'No early answer leak',
      { correctIndex: false, explanations: false },
      { correctIndex: 'correctIndex' in before.body, explanations: 'explanations' in before.body },
    );
    await request(app.getHttpServer())
      .post(`/api/v1/missions/${q.id}/quiz/answer`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selectedIndex: 0 })
      .expect(201)
      .expect((r) => expect(r.body.pointsAwarded).toBe(0));
    record('Wrong answer XP', 480, await gamification.getUserTotalPoints(student));
    const answers = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post(`/api/v1/missions/${q.id}/quiz/answer`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ selectedIndex: 2 }),
      ),
    );
    record('Concurrent quiz answer statuses', [201, 400], answers.map((r) => r.status).sort());
    record('Quiz XP/rankings', { xp: 485, global: 485, classroom: 485 }, await totals());
    await request(app.getHttpServer())
      .post(`/api/v1/missions/${q.id}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);
  }, 30000);

  it('rejects fractional answer and blocks completing a quiz without answering', async () => {
    const q = await mission(true);
    await request(app.getHttpServer())
      .post(`/api/v1/missions/${q.id}/quiz/answer`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selectedIndex: 1.5 })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/missions/${q.id}/start`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/missions/${q.id}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);
    record('Quiz bypass XP', 485, await gamification.getUserTotalPoints(student));
  });

  it('applies shared structural validation and author audit to manually published quizzes', async () => {
    const body = {
      title: 'Quiz manual sintético',
      question: 'Quanto é 2 + 2?',
      difficulty: 'FACIL',
      options: ['1', '2', '4', '5'],
      correctIndex: 2,
      explanations: ['Errada.', 'Errada.', 'Dois mais dois é quatro.', 'Errada.'],
    };
    await request(app.getHttpServer())
      .post('/api/v1/missions/quiz')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...body, options: ['1', '1', '4', '5'] })
      .expect(400);
    const published = await request(app.getHttpServer())
      .post('/api/v1/missions/quiz')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body)
      .expect(201);
    missions.push(published.body.id);
    const saved = await prisma.missionQuiz.findUniqueOrThrow({
      where: { missionId: published.body.id },
    });
    record(
      'Manual synthetic publication audit',
      { status: 'APPROVED', author: true, difficulty: 'FACIL', points: 40 },
      {
        status: saved.reviewStatus,
        author: saved.reviewedById === admin,
        difficulty: saved.difficulty,
        points: published.body.points,
      },
    );
  });

  it('gates pending content, enforces reviewer permissions and publishes only after recorded approval', async () => {
    const q = await mission(true, true, classroom);
    const http = app.getHttpServer();
    await request(http)
      .get('/api/v1/missions/quiz-review/pending')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
    await request(http)
      .get(`/api/v1/missions/${q.id}/quiz/admin`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
    await request(http)
      .get(`/api/v1/missions/${q.id}/quiz`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);
    await request(http)
      .post(`/api/v1/missions/${q.id}/quiz/answer`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selectedIndex: 2 })
      .expect(404);
    await request(http)
      .post(`/api/v1/missions/${q.id}/start`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);
    const available = await request(http)
      .get('/api/v1/missions/available')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(available.body.some((m: { id: string }) => m.id === q.id)).toBe(false);
    const queue = await request(http)
      .get('/api/v1/missions/quiz-review/pending')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    expect(
      queue.body.find((row: { missionId: string }) => row.missionId === q.id)?.correctIndex,
    ).toBe(2);
    await request(http)
      .post(`/api/v1/missions/${q.id}/quiz/review`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ decision: 'APPROVED', reason: 'Synthetic test' })
      .expect(403);
    const foreign = await mission(true, true);
    await prisma.mission.update({ where: { id: foreign.id }, data: { createdById: admin } });
    await request(http)
      .post(`/api/v1/missions/${foreign.id}/quiz/review`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ decision: 'APPROVED', reason: 'Synthetic test' })
      .expect(403);
    await request(http)
      .post(`/api/v1/missions/${q.id}/quiz/review`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        decision: 'APPROVED',
        reason: 'Automated synthetic workflow test; no pedagogical human review',
      })
      .expect(201);
    const saved = await prisma.missionQuiz.findUniqueOrThrow({ where: { missionId: q.id } });
    record(
      'Synthetic approval audit',
      { status: 'APPROVED', reviewer: true, timestamp: true },
      {
        status: saved.reviewStatus,
        reviewer: saved.reviewedById === teacher,
        timestamp: !!saved.reviewedAt,
      },
    );
    await request(http)
      .get(`/api/v1/missions/${q.id}/quiz`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    await request(http)
      .post(`/api/v1/missions/${q.id}/quiz/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'REJECTED', reason: 'Synthetic second decision' })
      .expect(400);
    await request(http)
      .post(`/api/v1/missions/${foreign.id}/quiz/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'REJECTED', reason: 'Synthetic rejection' })
      .expect(201);
    await request(http)
      .get(`/api/v1/missions/${foreign.id}/quiz`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);
  }, 30000);

  it('grants one achievement reward under concurrency and rolls back state together with XP', async () => {
    const a = await prisma.achievement.create({
      data: {
        name: 'TCC synthetic',
        description: 'Isolated',
        category: 'TCC',
        points: 30,
        condition: `TCC_${Date.now()}`,
      },
    });
    achievements.push(a.id);
    await Promise.all([
      gamification.unlockAchievement(student, a.id),
      gamification.unlockAchievement(student, a.id),
    ]);
    record(
      'Achievement reward once',
      { xp: 515, credits: 1, unlocks: 1 },
      {
        xp: await gamification.getUserTotalPoints(student),
        credits: await prisma.userPoint.count({
          where: { userId: student, source: 'CONQUISTA', referenceId: a.id },
        }),
        unlocks: await prisma.userAchievement.count({
          where: { userId: student, achievementId: a.id },
        }),
      },
    );
    await expect(
      prisma.$transaction(async (tx) => {
        await lockRewardUser(tx, student);
        await awardOnce(tx, {
          userId: student,
          points: 99,
          source: 'MISSAO',
          description: 'rollback',
          referenceId: 'tcc-rollback',
        });
        throw new Error('intentional rollback');
      }),
    ).rejects.toThrow('intentional rollback');
    record('Rollback XP', 515, await gamification.getUserTotalPoints(student));
    const rank = await gamification.getUserRankingPosition(student, 'TURMA', classroom);
    record('Achievement reflected in class ranking', 515, rank?.points);
  });

  it('credits grading once under concurrency', async () => {
    const activity = await prisma.activity.create({
      data: {
        classId: classroom,
        createdById: teacher,
        type: 'TEXT',
        title: 'TCC grading',
        description: 'Synthetic',
        maxScore: 10,
        xpReward: 100,
      },
    });
    const submission = await prisma.activitySubmission.create({
      data: { activityId: activity.id, userId: peer, attemptNumber: 1, status: 'SUBMITTED' },
    });
    const service = app.get(ActivitiesService);
    await Promise.all(
      [1, 2].map(() =>
        service.gradeSubmission(
          submission.id,
          { score: 10 },
          { id: teacher, role: Role.PROFESSOR },
        ),
      ),
    );
    record(
      'Concurrent grading XP',
      { xp: 100, credits: 1, storedXp: 100 },
      {
        xp: await gamification.getUserTotalPoints(peer),
        credits: await prisma.userPoint.count({
          where: { userId: peer, source: 'ACTIVITY_GRADE', referenceId: submission.id },
        }),
        storedXp: (
          await prisma.activitySubmission.findUniqueOrThrow({ where: { id: submission.id } })
        ).xpAwarded,
      },
    );
  });

  it('automatically publishes exactly one daily quiz across two instances, ignores legacy human mode and exposes no future quiz', async () => {
    const generated = await prisma.aIGeneration.create({
      data: { type: 'SYNTHETIC_TCC', prompt: 'Simulated only', response: 'Simulated only' },
    });
    const config = {
      get: (key: string) =>
        (
          ({
            OPENAI_API_KEY: 'simulation-only',
            QUIZ_REVIEW_MODE: 'human',
            APP_TIME_ZONE: 'America/Sao_Paulo',
          }) as Record<string, string>
        )[key],
    } as ConfigService;
    const generators = [
      new QuizGeneratorService(prisma, config),
      new QuizGeneratorService(prisma, config),
    ];
    for (const generator of generators)
      jest.spyOn(generator, 'generateReviewedQuiz').mockResolvedValue({
        quiz: {
          title: 'Daily simulated',
          question: 'Quanto é 2 + 2?',
          difficulty: 'FACIL',
          options: ['1', '2', '4', '5'],
          explanations: ['Errada.', 'Errada.', 'Dois mais dois é quatro.', 'Errada.'],
          correctIndex: 2,
        },
        generationId: generated.id,
        audit: [],
        reason: null,
        requestedDifficulty: 'FACIL',
        returnedDifficulty: 'FACIL',
      });
    await Promise.all(generators.map((generator) => generator.generateDailyQuizMission()));
    const { dayKey } = getDailyQuizDateWindow();
    const saved = await prisma.mission.findMany({
      where: { dailyKey: dayKey },
      include: { quiz: true },
    });
    missions.push(...saved.map((m) => m.id));
    record(
      'Daily concurrent persistence with simulated generation',
      { missions: 1, published: 'APPROVED' },
      { missions: saved.length, published: saved[0]?.quiz?.reviewStatus },
    );
    await generators[0].generateDailyQuizMission();
    expect(generators[0].generateReviewedQuiz).toHaveBeenCalledTimes(1);
    await prisma.mission.deleteMany({ where: { id: { in: saved.map((m) => m.id) } } });
    const automatic = new QuizGeneratorService(prisma, {
      get: (key: string) => (key === 'QUIZ_REVIEW_MODE' ? 'automatic' : config.get(key)),
    } as ConfigService);
    jest
      .spyOn(automatic, 'generateReviewedQuiz')
      .mockResolvedValue(await generators[0].generateReviewedQuiz());
    const published = await automatic.generateDailyQuizMission();
    const automaticMission = await prisma.mission.findUniqueOrThrow({
      where: { dailyKey: dayKey },
      include: { quiz: true },
    });
    missions.push(automaticMission.id);
    record(
      'Explicit automatic mode with simulated generation',
      { published: true, status: 'APPROVED', humanReviewer: null },
      {
        published: !!published,
        status: automaticMission.quiz?.reviewStatus,
        humanReviewer: automaticMission.quiz?.reviewedById,
      },
    );
    await prisma.mission.delete({ where: { id: automaticMission.id } });
    await prisma.aIGeneration.delete({ where: { id: generated.id } });
    const future = await mission(true);
    await prisma.mission.update({
      where: { id: future.id },
      data: { type: 'DIARIA', startDate: new Date(Date.now() + 86400000) },
    });
    await request(app.getHttpServer())
      .get(`/api/v1/missions/${future.id}/quiz`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);
  });

  it('awards a seven-day streak bonus once despite simultaneous updates', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    await prisma.user.update({
      where: { id: student },
      data: { currentStreak: 6, longestStreak: 6, streakLastDate: yesterday },
    });
    await Promise.all([gamification.updateStreak(student), gamification.updateStreak(student)]);
    record(
      'Concurrent streak bonus',
      { streak: 7, credits: 1, xp: 565 },
      {
        streak: (await prisma.user.findUniqueOrThrow({ where: { id: student } })).currentStreak,
        credits: await prisma.userPoint.count({
          where: { userId: student, source: 'STREAK_BONUS' },
        }),
        xp: await gamification.getUserTotalPoints(student),
      },
    );
  });

  it('credits programming from the ledger, including reprocessing and score improvement', async () => {
    const problem = await prisma.programmingProblem.create({
      data: {
        title: 'TCC',
        statement: 'Synthetic',
        difficulty: 'FACIL',
        createdById: teacher,
        allowedLanguages: ['JAVASCRIPT'],
        starterCode: {},
      },
    });
    const assignment = await prisma.programmingAssignment.create({
      data: { problemId: problem.id, classId: classroom, title: 'TCC programming', points: 100 },
    });
    const sub = await prisma.codeSubmission.create({
      data: {
        userId: peer,
        problemId: problem.id,
        assignmentId: assignment.id,
        language: 'JAVASCRIPT',
        code: 'console.log(1)',
        mode: 'SUBMIT',
        status: 'ACCEPTED',
        score: 70,
      },
    });
    const service = new ProgrammingGamificationService(prisma);
    const rewards = await Promise.all([
      service.processSubmission(sub.id, CodeSubmissionStatus.ACCEPTED),
      service.processSubmission(sub.id, CodeSubmissionStatus.ACCEPTED),
    ]);
    record(
      'Programming concurrent rewards',
      [0, 70],
      rewards.sort((a, b) => a - b),
    );
    await prisma.codeSubmission.update({ where: { id: sub.id }, data: { score: 100 } });
    record(
      'Programming improvement delta',
      30,
      await service.processSubmission(sub.id, CodeSubmissionStatus.ACCEPTED),
    );
    record(
      'Programming reprocessing delta',
      0,
      await service.processSubmission(sub.id, CodeSubmissionStatus.ACCEPTED),
    );
    record('Grading plus programming XP', 200, await gamification.getUserTotalPoints(peer));
    await prisma.codeSubmission.delete({ where: { id: sub.id } });
    await prisma.programmingAssignment.delete({ where: { id: assignment.id } });
    await prisma.programmingProblem.delete({ where: { id: problem.id } });
  }, 30000);

  it('excludes staff before positioning, breaks ties deterministically, removes unenrolled stale entries and supports >100 students', async () => {
    await gamification.addPoints(admin, 9999, 'TCC_BASE', 'Synthetic staff points');
    await prisma.classStudent.create({ data: { classId: classroom, userId: peer } });
    await gamification.updateClassRanking(classroom);
    await prisma.classStudent.delete({
      where: { classId_userId: { classId: classroom, userId: peer } },
    });
    const classRanking = await gamification.getRanking('TURMA', classroom);
    record(
      'Unenrolled ranking removal',
      [student],
      classRanking.map((row) => row.userId),
    );
    for (let i = 0; i < 101; i++) {
      const u = await prisma.user.create({
        data: {
          name: 'Zero XP synthetic student',
          email: `zero-${Date.now()}-${i}@example.invalid`,
          password: 'unused-synthetic',
          role: 'ALUNO',
        },
      });
      users.push(u.id);
    }
    const ranking = await gamification.getRanking('GLOBAL', undefined, 200);
    record('Global ranking >100 eligible users', 103, ranking.length);
    record(
      'Global ranking contiguous student positions',
      true,
      ranking.every((row, i) => row.position === i + 1),
    );
    const zero = ranking.filter((r) => r.points === 0).map((r) => r.userId);
    record('Deterministic ties', [...zero].sort(), zero);
    record(
      'Staff excluded',
      false,
      ranking.some((r) => r.userId === admin || r.userId === teacher),
    );
  }, 30000);
});
