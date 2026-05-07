import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let professorToken: string;
  let alunoToken: string;
  let adminUser: any;
  let professorUser: any;
  let alunoUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Criar usuários de teste
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `admin-${Date.now()}@test.com`,
        password: 'password123',
        name: 'Admin User',
        role: Role.ADMIN,
      });
    adminToken = adminRes.body.access_token;
    adminUser = adminRes.body.user;

    const professorRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `professor-${Date.now()}@test.com`,
        password: 'password123',
        name: 'Professor User',
        role: Role.PROFESSOR,
      });
    professorToken = professorRes.body.access_token;
    professorUser = professorRes.body.user;

    const alunoRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `aluno-${Date.now()}@test.com`,
        password: 'password123',
        name: 'Aluno User',
        role: Role.ALUNO,
      });
    alunoToken = alunoRes.body.access_token;
    alunoUser = alunoRes.body.user;
  });

  afterAll(async () => {
    // Limpar usuários de teste
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminUser.email, professorUser.email, alunoUser.email],
        },
      },
    });
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should return paginated users for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return paginated users for professor', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${professorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should filter users by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users?role=ALUNO')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.every((u: any) => u.role === Role.ALUNO)).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(401);
    });

    it('should fail for aluno role', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${alunoToken}`)
        .expect(403);
    });
  });

  describe('/users/me (GET)', () => {
    it('should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${alunoToken}`)
        .expect(200);

      expect(response.body.id).toBe(alunoUser.id);
      expect(response.body.email).toBe(alunoUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${alunoUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(alunoUser.id);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/users/me (PATCH)', () => {
    it('should update own profile', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({ name: 'Updated Aluno Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Aluno Name');
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update user as admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${alunoUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Admin Updated Name');
    });

    it('should fail as non-admin', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({ name: 'Should Fail' })
        .expect(403);
    });
  });

  describe('/users/me/avatar (POST)', () => {
    it('should upload avatar for current user', async () => {
      const testImagePath = path.join(__dirname, '..', 'fixtures', 'test-avatar.jpg');
      
      // Se não existir imagem de teste, pular
      if (!fs.existsSync(testImagePath)) {
        console.log('Skipping avatar upload test - no test image');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/users/me/avatar')
        .set('Authorization', `Bearer ${alunoToken}`)
        .attach('avatar', testImagePath)
        .expect(200);

      expect(response.body.avatar).toBeDefined();
      expect(response.body.avatar).toContain('/uploads/avatars/');
    });

    it('should fail without file', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/me/avatar')
        .set('Authorization', `Bearer ${alunoToken}`)
        .expect(400);
    });
  });

  describe('/users (POST)', () => {
    it('should create user as admin', async () => {
      const newUser = {
        email: `new-user-${Date.now()}@test.com`,
        password: 'password123',
        name: 'New Test User',
        role: Role.ALUNO,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body.email).toBe(newUser.email);
      expect(response.body).not.toHaveProperty('password');

      // Limpar
      await prisma.user.delete({ where: { id: response.body.id } });
    });

    it('should fail as non-admin', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          email: 'should-fail@test.com',
          password: 'password123',
          name: 'Should Fail',
          role: Role.ALUNO,
        })
        .expect(403);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete user as admin', async () => {
      // Criar usuário temporário
      const tempUser = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `temp-${Date.now()}@test.com`,
          password: 'password123',
          name: 'Temp User',
          role: Role.ALUNO,
        });

      await request(app.getHttpServer())
        .delete(`/api/v1/users/${tempUser.body.user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail as non-admin', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${alunoUser.id}`)
        .set('Authorization', `Bearer ${professorToken}`)
        .expect(403);
    });
  });
});
