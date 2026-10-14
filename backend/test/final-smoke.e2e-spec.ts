import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/modules/mail/mail.service';

describe('Final synthetic cross-module API smoke', () => {
  let app: INestApplication, prisma: PrismaService;
  const users: string[] = [];
  let classId: string | undefined;
  const checks: Array<{ scenario: string; expected: unknown; obtained: unknown }> = [];
  const record = (scenario: string, expected: unknown, obtained: unknown) => {
    checks.push({ scenario, expected, obtained });
    expect(obtained).toEqual(expected);
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined) })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (prisma) {
      if (classId) await prisma.class.deleteMany({ where: { id: classId } });
      await prisma.user.deleteMany({ where: { id: { in: users } } });
    }
    const dir = resolve(process.env.TCC_EVIDENCE_DIR || '../../logs/tcc-final');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'smoke-resultados.json'), JSON.stringify(checks, null, 2));
    if (app) await app.close();
  });

  it('logs in, approves enrollment, publishes/submits/grades, reads posts and notifications, checks admin access', async () => {
    const tokens: string[] = [];
    const password = 'SyntheticFinal123!';
    const passwordHash = await bcrypt.hash(password, 10);
    for (const role of [Role.PROFESSOR, Role.ALUNO, Role.ADMIN, Role.ALUNO]) {
      const user = await prisma.user.create({
        data: {
          name: `Synthetic final ${role}`,
          email: `final-${Date.now()}-${users.length}@example.com`,
          password: passwordHash,
          role,
        },
      });
      users.push(user.id);
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password })
        .expect(201);
      expect(login.body.user.password).toBeUndefined();
      tokens.push(login.body.access_token);
    }
    const [teacher, student, admin, outsider] = tokens;
    const api = (token: string) => ({ Authorization: `Bearer ${token}` });
    await request(app.getHttpServer()).get('/api/v1/admin/stats').expect(401);
    await request(app.getHttpServer()).get('/api/v1/admin/stats').set(api(student)).expect(403);
    const created = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set(api(teacher))
      .send({ name: 'Final synthetic class', year: 2026, settings: { requireJoinApproval: true } })
      .expect(201);
    classId = created.body.id;
    const joined = await request(app.getHttpServer())
      .post('/api/v1/classes/join')
      .set(api(student))
      .send({ code: created.body.code })
      .expect(201);
    record('Enrollment initially pending', 'PENDING_APPROVAL', joined.body.status);
    record(
      'Pending request is not an enrollment',
      0,
      await prisma.classStudent.count({ where: { classId, userId: users[1] } }),
    );
    await request(app.getHttpServer())
      .post(`/api/v1/classes/${classId}/join-requests/${joined.body.request.id}/approve`)
      .set(api(teacher))
      .expect(201);
    record(
      'Approved enrollment persisted',
      1,
      await prisma.classStudent.count({ where: { classId, userId: users[1] } }),
    );
    const activity = await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set(api(teacher))
      .send({
        classId,
        type: 'TEXT',
        title: 'Final text exercise',
        description: 'Synthetic only',
        xpReward: 25,
      })
      .expect(201);
    record('Activity starts as draft', 'DRAFT', activity.body.status);
    const published = await request(app.getHttpServer())
      .post(`/api/v1/activities/${activity.body.id}/publish`)
      .set(api(teacher))
      .expect(201);
    record('Publication persisted', 'PUBLISHED', published.body.status);
    await request(app.getHttpServer())
      .get(`/api/v1/activities/${activity.body.id}`)
      .set(api(outsider))
      .expect(404);
    const before = await prisma.userPoint.aggregate({
      where: { userId: users[1] },
      _sum: { points: true },
    });
    const submitted = await request(app.getHttpServer())
      .post(`/api/v1/activities/${activity.body.id}/submissions/submit`)
      .set(api(student))
      .send({ textAnswer: 'Synthetic final answer' })
      .expect(201);
    record('Submission persisted', 'SUBMITTED', submitted.body.status);
    const gradePath = `/api/v1/activities/${activity.body.id}/submissions/${submitted.body.id}/grade`;
    await request(app.getHttpServer())
      .patch(gradePath)
      .set(api(student))
      .send({ score: 80 })
      .expect(403);
    const graded = await request(app.getHttpServer())
      .patch(gradePath)
      .set(api(teacher))
      .send({ score: 80, feedback: 'Synthetic feedback' })
      .expect(200);
    record(
      'Grade state and reward',
      { status: 'GRADED', score: 80, xpAwarded: 25 },
      { status: graded.body.status, score: graded.body.score, xpAwarded: graded.body.xpAwarded },
    );
    await request(app.getHttpServer())
      .patch(gradePath)
      .set(api(teacher))
      .send({ score: 90 })
      .expect(200);
    const after = await prisma.userPoint.aggregate({
      where: { userId: users[1] },
      _sum: { points: true },
    });
    record('Regrading awards XP once', 25, (after._sum.points || 0) - (before._sum.points || 0));
    const post = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set(api(teacher))
      .send({ classId, title: 'Final synthetic post', content: 'Synthetic class announcement' })
      .expect(201);
    const read = await request(app.getHttpServer())
      .get(`/api/v1/posts/${post.body.id}`)
      .set(api(student))
      .expect(200);
    record('Enrolled student reads published post', post.body.id, read.body.id);
    await request(app.getHttpServer())
      .get(`/api/v1/posts/${post.body.id}`)
      .set(api(outsider))
      .expect(403);
    const notifications = await request(app.getHttpServer())
      .get('/api/v1/notifications?limit=100')
      .set(api(student))
      .expect(200);
    const notice = notifications.body.data.find((n: { message: string }) =>
      n.message.includes(post.body.title),
    );
    record('Post notification persisted and listed', true, Boolean(notice));
    const marked = await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${notice.id}/read`)
      .set(api(student))
      .expect(200);
    record('Notification marked read', true, marked.body.read);
    const stats = await request(app.getHttpServer())
      .get('/api/v1/admin/stats')
      .set(api(admin))
      .expect(200);
    record(
      'Admin statistics match database',
      { classes: await prisma.class.count(), posts: await prisma.post.count() },
      { classes: stats.body.classes.total, posts: stats.body.posts.total },
    );
  }, 30000);
});
