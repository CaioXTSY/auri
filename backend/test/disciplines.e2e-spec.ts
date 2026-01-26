import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('DisciplinesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let professorToken: string;
  let studentToken: string;
  let adminId: string;
  let professorId: string;
  let studentId: string;
  let disciplineId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Limpar banco
    await prisma.discipline.deleteMany();
    await prisma.user.deleteMany();

    // Criar usuários de teste
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;

    const professor = await prisma.user.create({
      data: {
        name: 'Professor User',
        email: 'professor@test.com',
        password: hashedPassword,
        role: Role.PROFESSOR,
      },
    });
    professorId = professor.id;

    const student = await prisma.user.create({
      data: {
        name: 'Student User',
        email: 'student@test.com',
        password: hashedPassword,
        role: Role.ALUNO,
      },
    });
    studentId = student.id;

    // Fazer login para obter tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'Test123!' });
    adminToken = adminLogin.body.access_token;

    const professorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'professor@test.com', password: 'Test123!' });
    professorToken = professorLogin.body.access_token;

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@test.com', password: 'Test123!' });
    studentToken = studentLogin.body.access_token;
  }, 30000);

  afterAll(async () => {
    await prisma.discipline.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('POST /disciplines', () => {
    it('should create a discipline as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/disciplines')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Introdução à Programação',
          description: 'Fundamentos de programação',
          language: 'Python',
          status: 'ATIVA',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Introdução à Programação');
      expect(response.body.language).toBe('Python');
      disciplineId = response.body.id;
    });

    it('should create a discipline as professor', async () => {
      const response = await request(app.getHttpServer())
        .post('/disciplines')
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          name: 'Algoritmos',
          description: 'Estruturas de dados',
          language: 'Java',
          status: 'ATIVA',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Algoritmos');
    });

    it('should not create a discipline as student', async () => {
      await request(app.getHttpServer())
        .post('/disciplines')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Banco de Dados',
          description: 'SQL e NoSQL',
          language: 'SQL',
          status: 'ATIVA',
        })
        .expect(403);
    });
  });

  describe('GET /disciplines', () => {
    it('should list all disciplines with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/disciplines')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by createdById', async () => {
      const response = await request(app.getHttpServer())
        .get('/disciplines')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ createdById: adminId })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((discipline) => {
        expect(discipline.createdById).toBe(adminId);
      });
    });

    it('should filter by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/disciplines')
        .set('Authorization', `Bearer ${professorToken}`)
        .query({ name: 'Programação' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((discipline) => {
        expect(discipline.name.toLowerCase()).toContain('programação');
      });
    });

    it('should filter by language', async () => {
      const response = await request(app.getHttpServer())
        .get('/disciplines')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ language: 'Python' })
        .expect(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach((discipline) => {
          expect(discipline.language).toContain('Python');
        });
      }
    });

    it('should sort by name ascending', async () => {
      const response = await request(app.getHttpServer())
        .get('/disciplines')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ sortBy: 'name', sortOrder: 'asc' })
        .expect(200);

      const names = response.body.data.map((d) => d.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('GET /disciplines/:id', () => {
    it('should get a discipline by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/disciplines/${disciplineId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.id).toBe(disciplineId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('language');
      expect(response.body).toHaveProperty('createdBy');
    });

    it('should return 404 for non-existent discipline', async () => {
      await request(app.getHttpServer())
        .get('/disciplines/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /disciplines/:id', () => {
    it('should update a discipline as admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/disciplines/${disciplineId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Programação I - Atualizado',
          description: 'Descrição atualizada',
        })
        .expect(200);

      expect(response.body.name).toBe('Programação I - Atualizado');
      expect(response.body.description).toBe('Descrição atualizada');
    });

    it('should update a discipline as professor', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/disciplines/${disciplineId}`)
        .set('Authorization', `Bearer ${professorToken}`)
        .send({
          description: 'Nova descrição',
        })
        .expect(200);

      expect(response.body.description).toBe('Nova descrição');
    });

    it('should not update a discipline as student', async () => {
      await request(app.getHttpServer())
        .patch(`/disciplines/${disciplineId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Tentativa de atualização',
        })
        .expect(403);
    });

    it('should return 404 when updating non-existent discipline', async () => {
      await request(app.getHttpServer())
        .patch('/disciplines/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Teste' })
        .expect(404);
    });
  });

  describe('DELETE /disciplines/:id', () => {
    it('should not delete a discipline as student', async () => {
      await request(app.getHttpServer())
        .delete(`/disciplines/${disciplineId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should not delete a discipline as professor', async () => {
      await request(app.getHttpServer())
        .delete(`/disciplines/${disciplineId}`)
        .set('Authorization', `Bearer ${professorToken}`)
        .expect(403);
    });

    it('should delete a discipline as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/disciplines/${disciplineId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verificar se foi deletado
      await request(app.getHttpServer())
        .get(`/disciplines/${disciplineId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent discipline', async () => {
      await request(app.getHttpServer())
        .delete('/disciplines/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Authorization', () => {
    it('should not allow access without token', async () => {
      await request(app.getHttpServer()).get('/disciplines').expect(401);
    });

    it('should not allow access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/disciplines')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
