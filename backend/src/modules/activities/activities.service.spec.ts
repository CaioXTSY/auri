import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    discipline: {
      findUnique: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
    },
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    testCase: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create activity successfully', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const dto = {
        disciplineId: 'discipline-1',
        title: 'FizzBuzz',
        description: 'Test activity',
        type: 'EXERCISE' as any,
        difficulty: 'FACIL' as any,
        points: 100,
        deadline: futureDate.toISOString(),
        allowLateSubmission: true,
      };
      const userId = 'user-1';

      const mockDiscipline = { id: 'discipline-1', name: 'Programming' };
      const mockActivity = {
        id: 'activity-1',
        ...dto,
        createdById: userId,
        status: 'ATIVA',
        discipline: mockDiscipline,
        _count: { testCases: 0, submissions: 0 },
      };

      mockPrismaService.discipline.findUnique.mockResolvedValue(mockDiscipline);
      mockPrismaService.activity.create.mockResolvedValue(mockActivity);

      const result = await service.create(dto, userId);

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.discipline.findUnique).toHaveBeenCalledWith({
        where: { id: dto.disciplineId },
      });
      expect(mockPrismaService.activity.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if discipline not found', async () => {
      const dto = {
        disciplineId: 'invalid-id',
        title: 'Test',
        description: 'Test',
        type: 'EXERCISE' as any,
        difficulty: 'FACIL' as any,
        points: 100,
        allowLateSubmission: true,
      };

      mockPrismaService.discipline.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if deadline is in the past', async () => {
      const dto = {
        disciplineId: 'discipline-1',
        title: 'Test',
        description: 'Test',
        type: 'EXERCISE' as any,
        difficulty: 'FACIL' as any,
        points: 100,
        deadline: new Date('2020-01-01').toISOString(),
        allowLateSubmission: true,
      };

      mockPrismaService.discipline.findUnique.mockResolvedValue({
        id: 'discipline-1',
      });

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate class if classId is provided', async () => {
      const dto = {
        disciplineId: 'discipline-1',
        classId: 'class-1',
        title: 'Test',
        description: 'Test',
        type: 'EXERCISE' as any,
        difficulty: 'FACIL' as any,
        points: 100,
        allowLateSubmission: true,
      };

      const mockDiscipline = { id: 'discipline-1' };
      const mockClass = { id: 'class-1' };

      mockPrismaService.discipline.findUnique.mockResolvedValue(mockDiscipline);
      mockPrismaService.class.findUnique.mockResolvedValue(mockClass);
      mockPrismaService.activity.create.mockResolvedValue({ id: 'activity-1' });

      await service.create(dto, 'user-1');

      expect(mockPrismaService.class.findUnique).toHaveBeenCalledWith({
        where: { id: dto.classId },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated activities', async () => {
      const query = { page: 1, limit: 10 };
      const mockActivities = [
        {
          id: 'activity-1',
          title: 'Test',
          discipline: { id: 'discipline-1', name: 'Programming' },
          _count: { testCases: 5, submissions: 10 },
        },
      ];

      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);
      mockPrismaService.activity.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result.data).toEqual(mockActivities);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by disciplineId', async () => {
      const query = { page: 1, limit: 10, disciplineId: 'discipline-1' };

      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockPrismaService.activity.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ disciplineId: 'discipline-1' }),
        }),
      );
    });

    it('should filter by type', async () => {
      const query = { page: 1, limit: 10, type: 'EXERCISE' as any };

      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockPrismaService.activity.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'EXERCISE' }),
        }),
      );
    });

    it('should search by title', async () => {
      const query = { page: 1, limit: 10, title: 'FizzBuzz' };

      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockPrismaService.activity.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: { contains: 'FizzBuzz', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return activity with all details', async () => {
      const mockActivity = {
        id: 'activity-1',
        title: 'Test',
        discipline: { id: 'discipline-1' },
        class: { id: 'class-1' },
        createdBy: { id: 'user-1' },
        testCases: [],
        _count: { submissions: 5 },
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);

      const result = await service.findOne('activity-1');

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.activity.findUnique).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update activity successfully', async () => {
      const dto = { title: 'Updated Title', points: 150 };
      const mockActivity = { id: 'activity-1', ...dto };

      mockPrismaService.activity.findUnique.mockResolvedValue({
        id: 'activity-1',
      });
      mockPrismaService.activity.update.mockResolvedValue(mockActivity);

      const result = await service.update('activity-1', dto);

      expect(result).toEqual(mockActivity);
      expect(mockPrismaService.activity.update).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
        data: dto,
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate new discipline if disciplineId is provided', async () => {
      const dto = { disciplineId: 'new-discipline' };

      mockPrismaService.activity.findUnique.mockResolvedValue({
        id: 'activity-1',
      });
      mockPrismaService.discipline.findUnique.mockResolvedValue(null);

      await expect(service.update('activity-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete activity successfully', async () => {
      const mockActivity = {
        id: 'activity-1',
        _count: { submissions: 0 },
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);
      mockPrismaService.activity.delete.mockResolvedValue(mockActivity);

      const result = await service.remove('activity-1');

      expect(result).toEqual({ message: 'Activity successfully deleted' });
      expect(mockPrismaService.activity.delete).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if activity has submissions', async () => {
      const mockActivity = {
        id: 'activity-1',
        _count: { submissions: 5 },
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);

      await expect(service.remove('activity-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createTestCase', () => {
    it('should create test case successfully', async () => {
      const dto = {
        input: '5',
        expectedOutput: 'Fizz',
        points: 20,
        isVisible: true,
      };
      const mockActivity = { id: 'activity-1' };
      const mockTestCase = { id: 'test-1', ...dto, activityId: 'activity-1' };

      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);
      mockPrismaService.testCase.create.mockResolvedValue(mockTestCase);

      const result = await service.createTestCase('activity-1', dto);

      expect(result).toEqual(mockTestCase);
      expect(mockPrismaService.testCase.create).toHaveBeenCalledWith({
        data: { ...dto, activityId: 'activity-1' },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(
        service.createTestCase('invalid-id', {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findTestCases', () => {
    it('should return all test cases', async () => {
      const mockTestCases = [
        { id: 'test-1', input: '5', expectedOutput: 'Fizz' },
      ];

      mockPrismaService.activity.findUnique.mockResolvedValue({
        id: 'activity-1',
      });
      mockPrismaService.testCase.findMany.mockResolvedValue(mockTestCases);

      const result = await service.findTestCases('activity-1');

      expect(result).toEqual(mockTestCases);
      expect(mockPrismaService.testCase.findMany).toHaveBeenCalledWith({
        where: { activityId: 'activity-1' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.findTestCases('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeTestCase', () => {
    it('should delete test case successfully', async () => {
      const mockTestCase = { id: 'test-1', activityId: 'activity-1' };

      mockPrismaService.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrismaService.testCase.delete.mockResolvedValue(mockTestCase);

      const result = await service.removeTestCase('activity-1', 'test-1');

      expect(result).toEqual({ message: 'Test case successfully deleted' });
      expect(mockPrismaService.testCase.delete).toHaveBeenCalledWith({
        where: { id: 'test-1' },
      });
    });

    it('should throw NotFoundException if test case not found', async () => {
      mockPrismaService.testCase.findFirst.mockResolvedValue(null);

      await expect(
        service.removeTestCase('activity-1', 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
