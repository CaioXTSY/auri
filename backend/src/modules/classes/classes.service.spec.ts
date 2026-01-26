import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

describe('ClassesService', () => {
  let service: ClassesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    class: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    discipline: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    activity: {
      count: jest.fn(),
    },
    classStudent: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockDiscipline = {
    id: '1',
    name: 'Introdução à Programação',
    language: 'Python',
    status: 'ATIVA',
  };

  const mockClass = {
    id: '1',
    disciplineId: '1',
    name: 'Turma A',
    semester: '2024/1',
    year: 2024,
    status: 'ATIVA',
    createdAt: new Date(),
    updatedAt: new Date(),
    discipline: mockDiscipline,
  };

  const mockStudent = {
    id: '2',
    name: 'João Silva',
    email: 'joao@test.com',
    role: Role.ALUNO,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new class', async () => {
      const createDto = {
        disciplineId: '1',
        name: 'Turma A',
        semester: '2024/1',
        year: 2024,
      };

      mockPrismaService.discipline.findUnique.mockResolvedValue(mockDiscipline);
      mockPrismaService.class.create.mockResolvedValue(mockClass);

      const result = await service.create(createDto);

      expect(result).toEqual(mockClass);
      expect(mockPrismaService.class.create).toHaveBeenCalledWith({
        data: createDto,
        include: {
          discipline: {
            select: {
              id: true,
              name: true,
              language: true,
              status: true,
            },
          },
          _count: {
            select: {
              students: true,
              activities: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if discipline not found', async () => {
      const createDto = {
        disciplineId: '999',
        name: 'Turma A',
        semester: '2024/1',
        year: 2024,
      };

      mockPrismaService.discipline.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated classes', async () => {
      const classes = [mockClass];
      mockPrismaService.class.findMany.mockResolvedValue(classes);
      mockPrismaService.class.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(classes);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by disciplineId', async () => {
      const classes = [mockClass];
      mockPrismaService.class.findMany.mockResolvedValue(classes);
      mockPrismaService.class.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, disciplineId: '1' });

      expect(mockPrismaService.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ disciplineId: '1' }),
        }),
      );
    });

    it('should filter by name', async () => {
      const classes = [mockClass];
      mockPrismaService.class.findMany.mockResolvedValue(classes);
      mockPrismaService.class.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, name: 'Turma A' });

      expect(mockPrismaService.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Turma A' },
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      const classes = [mockClass];
      mockPrismaService.class.findMany.mockResolvedValue(classes);
      mockPrismaService.class.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, status: 'ATIVA' });

      expect(mockPrismaService.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ATIVA' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a class by id', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);

      const result = await service.findOne('1');

      expect(result).toEqual(mockClass);
    });

    it('should throw NotFoundException if class not found', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a class', async () => {
      const updateDto = { name: 'Turma B' };
      const updatedClass = { ...mockClass, ...updateDto };

      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.class.update.mockResolvedValue(updatedClass);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedClass);
    });

    it('should throw NotFoundException if discipline not found when updating', async () => {
      const updateDto = { disciplineId: '999' };

      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.discipline.findUnique.mockResolvedValue(null);

      await expect(service.update('1', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a class', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.activity.count.mockResolvedValue(0);
      mockPrismaService.class.delete.mockResolvedValue(mockClass);

      await service.remove('1');

      expect(mockPrismaService.class.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw BadRequestException if class has activities', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.activity.count.mockResolvedValue(5);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('enrollStudent', () => {
    it('should enroll a student', async () => {
      const enrollDto = { userId: '2' };
      const enrollment = {
        classId: '1',
        userId: '2',
        enrolledAt: new Date(),
        user: mockStudent,
        class: mockClass,
      };

      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.user.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.classStudent.findUnique.mockResolvedValue(null);
      mockPrismaService.classStudent.create.mockResolvedValue(enrollment);

      const result = await service.enrollStudent('1', enrollDto);

      expect(result).toEqual(enrollment);
    });

    it('should throw NotFoundException if class not found', async () => {
      const enrollDto = { userId: '2' };

      mockPrismaService.class.findUnique.mockResolvedValue(null);

      await expect(service.enrollStudent('1', enrollDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if class is not active', async () => {
      const enrollDto = { userId: '2' };
      const inactiveClass = { ...mockClass, status: 'ENCERRADA' };

      mockPrismaService.class.findUnique.mockResolvedValue(inactiveClass);

      await expect(service.enrollStudent('1', enrollDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const enrollDto = { userId: '999' };

      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.enrollStudent('1', enrollDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user is not a student', async () => {
      const enrollDto = { userId: '3' };
      const professor = { ...mockStudent, id: '3', role: Role.PROFESSOR };

      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.user.findUnique.mockResolvedValue(professor);

      await expect(service.enrollStudent('1', enrollDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if student already enrolled', async () => {
      const enrollDto = { userId: '2' };
      const existingEnrollment = { classId: '1', userId: '2' };

      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.user.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.classStudent.findUnique.mockResolvedValue(
        existingEnrollment,
      );

      await expect(service.enrollStudent('1', enrollDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('unenrollStudent', () => {
    it('should unenroll a student', async () => {
      const enrollment = { classId: '1', userId: '2' };

      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.classStudent.findUnique.mockResolvedValue(enrollment);
      mockPrismaService.classStudent.delete.mockResolvedValue(enrollment);

      await service.unenrollStudent('1', '2');

      expect(mockPrismaService.classStudent.delete).toHaveBeenCalledWith({
        where: {
          classId_userId: {
            classId: '1',
            userId: '2',
          },
        },
      });
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.classStudent.findUnique.mockResolvedValue(null);

      await expect(service.unenrollStudent('1', '2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMyClasses', () => {
    it('should return user enrolled classes', async () => {
      const enrollments = [
        {
          classId: '1',
          userId: '2',
          enrolledAt: new Date(),
          class: mockClass,
        },
      ];

      mockPrismaService.classStudent.findMany.mockResolvedValue(enrollments);

      const result = await service.getMyClasses('2');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('enrolledAt');
    });
  });
});
