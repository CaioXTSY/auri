import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as cookieParser from 'cookie-parser';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';

type TestAuthUser = {
  id: string;
  email: string;
};

const getRefreshCookie = (response: request.Response) => {
  const setCookie = response.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [String(setCookie)] : [];
  const refreshCookie = cookies.find((cookie) => cookie.startsWith('refresh_token='));

  expect(refreshCookie).toBeDefined();
  expect(refreshCookie).toContain('HttpOnly');

  return refreshCookie as string;
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let throttlerStorage: ThrottlerStorageService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    throttlerStorage = app.get<ThrottlerStorageService>(ThrottlerStorage);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
        role: 'ALUNO',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).not.toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.password).toBeUndefined();
      getRefreshCookie(response);

      // Cleanup
      await prisma.user.delete({ where: { email: registerDto.email } });
    });

    it('should fail with invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
        role: 'ALUNO',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should fail with short password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
        role: 'ALUNO',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    let testUser: TestAuthUser;

    beforeAll(async () => {
      const registerDto = {
        email: `login-test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Login Test User',
        role: 'ALUNO',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto);

      testUser = response.body.user;
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { email: testUser.email } });
    });

    it('should login successfully', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).not.toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('user');
      getRefreshCookie(response);
    });

    it('should fail with wrong password', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      await request(app.getHttpServer()).post('/api/v1/auth/login').send(loginDto).expect(401);
    });

    it('should fail with non-existent email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer()).post('/api/v1/auth/login').send(loginDto).expect(401);
    });

    it('should block repeated login attempts with HTTP 429', async () => {
      throttlerStorage.storage.clear();

      const loginDto = {
        email: `rate-limit-${Date.now()}@example.com`,
        password: 'wrongpassword',
      };

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await request(app.getHttpServer()).post('/api/v1/auth/login').send(loginDto).expect(401);
      }

      await request(app.getHttpServer()).post('/api/v1/auth/login').send(loginDto).expect(429);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshCookie: string;
    let testUser: TestAuthUser;

    beforeAll(async () => {
      const registerDto = {
        email: `refresh-test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Refresh Test User',
        role: 'ALUNO',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto);

      refreshCookie = getRefreshCookie(response);
      testUser = response.body.user;
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { email: testUser.email } });
    });

    it('should refresh token successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshCookie)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).not.toHaveProperty('refresh_token');
      getRefreshCookie(response);
    });

    it('should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', 'refresh_token=invalid-token')
        .expect(401);
    });
  });

  describe('/auth/forgot-password (POST)', () => {
    let testUser: TestAuthUser;

    beforeAll(async () => {
      const registerDto = {
        email: `forgot-test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Forgot Test User',
        role: 'ALUNO',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto);

      testUser = response.body.user;
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { email: testUser.email } });
    });

    it('should send reset password email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });

    it('should return success even for non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;
    let testUser: TestAuthUser;

    beforeAll(async () => {
      const registerDto = {
        email: `logout-test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Logout Test User',
        role: 'ALUNO',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto);

      accessToken = response.body.access_token;
      testUser = response.body.user;
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { email: testUser.email } });
    });

    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/logout').expect(401);
    });
  });
});
