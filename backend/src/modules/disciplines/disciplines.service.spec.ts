import { Test, TestingModule } from '@nestjs/testing';
import { DisciplinesService } from './disciplines.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

describe('DisciplinesService', () => {
  let service: DisciplinesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    discipline: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    class: {
      count: jest.fn(),
    },
  };

  const mockProfessor = {
    id: '1',
    name: 'Prof. Silva',
    email: 'prof@test.com',
    role: Role.PROFESSOR,
  };

  const mockDiscipline = {
    id: '1',
    name: 'Introdução à Programação',
    description: 'Fundamentos de programação',
    language: 'Python',
    status: 'ATIVA',
    createdById: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: mockProfessor,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisciplinesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DisciplinesService>(DisciplinesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new discipline', async () => {
      const createDto = {
        name: 'Introdução à Programação',
        description: 'Fundamentos de programação',
        language: 'Python',
        status: 'ATIVA',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockProfessor);
      mockPrismaService.discipline.create.mockResolvedValue(mockDiscipline);

      const result = await service.create(createDto, '1');

      expect(result).toEqual(mockDiscipline);
      expect(mockPrismaService.discipline.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          createdById: '1',
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const createDto = {
        name: 'Introdução à Programação',
        description: 'Fundamentos de programação',
        language: 'Python',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, '999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user is not PROFESSOR or ADMIN', async () => {
      const createDto = {
        name: 'Introdução à Programação',
        description: 'Fundamentos de programação',
        language: 'Python',
      };

      const studentUser = { ...mockProfessor, role: Role.ALUNO };

      mockPrismaService.user.findUnique.mockResolvedValue(studentUser);

      await expect(service.create(createDto, '1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated disciplines', async () => {
      const disciplines = [mockDiscipline];
      mockPrismaService.discipline.findMany.mockResolvedValue(disciplines);
      mockPrismaService.discipline.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(disciplines);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by createdById', async () => {
      const disciplines = [mockDiscipline];
      mockPrismaService.discipline.findMany.mockResolvedValue(disciplines);
      mockPrismaService.discipline.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, createdById: '1' });

      expect(mockPrismaService.discipline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ createdById: '1' }),
        }),
      );
    });

    it('should filter by name', async () => {
      const disciplines = [mockDiscipline];
      mockPrismaService.discipline.findMany.mockResolvedValue(disciplines);
      mockPrismaService.discipline.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, name: 'Programação' });

      expect(mockPrismaService.discipline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Programação' },
          }),
        }),
      );
    });

    it('should filter by language', async () => {
      const disciplines = [mockDiscipline];
      mockPrismaService.discipline.findMany.mockResolvedValue(disciplines);
      mockPrismaService.discipline.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, language: 'Python' });

      expect(mockPrismaService.discipline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            language: { contains: 'Python' },
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      const disciplines = [mockDiscipline];
      mockPrismaService.discipline.findMany.mockResolvedValue(disciplines);
      mockPrismaService.discipline.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, status: 'ATIVA' });

      expect(mockPrismaService.discipline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ATIVA' }),
        }),
      );
    });

    it('should sort by specified field', async () => {
      const disciplines = [mockDiscipline];
      mockPrismaService.discipline.findMany.mockResolvedValue(disciplines);
      mockPrismaService.discipline.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(mockPrismaService.discipline.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a discipline by id', async () => {
      mockPrismaService.discipline.findUnique.mockResolvedValue(mockDiscipline);

      const result = await service.findOne('1');

      expect(result).toEqual(mockDiscipline);
    });

    it('should throw NotFoundException if discipline not found', async () => {
      mockPrismaService.discipline.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a discipline', async () => {
      const updateDto = { name: 'Programação Avançada' };
      const updatedDiscipline = { ...mockDiscipline, ...updateDto };

      mockPrismaService.discipline.findUnique.mockResolvedValue(mockDiscipline);
      mockPrismaService.discipline.update.mockResolvedValue(updatedDiscipline);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedDiscipline);
      expect(mockPrismaService.discipline.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if discipline not found', async () => {
      mockPrismaService.discipline.findUnique.mockResolvedValue(null);

      await expect(service.update('999', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a discipline', async () => {
      mockPrismaService.discipline.findUnique.mockResolvedValue(mockDiscipline);
      mockPrismaService.class.count.mockResolvedValue(0);
      mockPrismaService.discipline.delete.mockResolvedValue(mockDiscipline);

      await service.remove('1');

      expect(mockPrismaService.discipline.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw BadRequestException if discipline has classes', async () => {
      mockPrismaService.discipline.findUnique.mockResolvedValue(mockDiscipline);
      mockPrismaService.class.count.mockResolvedValue(2);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if discipline not found', async () => {
      mockPrismaService.discipline.findUnique.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
