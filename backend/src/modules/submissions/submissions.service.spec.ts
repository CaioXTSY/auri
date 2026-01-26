import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsService } from './submissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';

describe('SubmissionsService', () => {
  let service: SubmissionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    activity: {
      findUnique: jest.fn(),
    },
    classStudent: {
      findUnique: jest.fn(),
    },
    submission: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    it('should create submission successfully', async () => {
      const dto = {
        activityId: 'activity-1',
        code: 'function test() {}',
        language: 'javascript',
      };
      const userId = 'user-1';

      const mockActivity = {
        id: 'activity-1',
        status: 'ATIVA',
        classId: null,
        deadline: futureDate,
        allowLateSubmission: true,
        testCases: [],
      };

      const mockSubmission = {
        id: 'submission-1',
        ...dto,
        userId,
        status: SubmissionStatus.PENDENTE,
        activity: { id: 'activity-1', title: 'Test', points: 100 },
        user: { id: userId, name: 'Test User', email: 'test@test.com' },
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);
      mockPrismaService.submission.create.mockResolvedValue(mockSubmission);

      const result = await service.create(dto, userId);

      expect(result).toEqual(mockSubmission);
      expect(mockPrismaService.activity.findUnique).toHaveBeenCalledWith({
        where: { id: dto.activityId },
        include: { class: true, testCases: true },
      });
    });

    it('should throw NotFoundException if activity not found', async () => {
      const dto = {
        activityId: 'invalid-id',
        code: 'test',
        language: 'javascript',
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if activity is not active', async () => {
      const dto = {
        activityId: 'activity-1',
        code: 'test',
        language: 'javascript',
      };

      const mockActivity = {
        id: 'activity-1',
        status: 'INATIVA',
        classId: null,
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user not enrolled in class', async () => {
      const dto = {
        activityId: 'activity-1',
        code: 'test',
        language: 'javascript',
      };

      const mockActivity = {
        id: 'activity-1',
        status: 'ATIVA',
        classId: 'class-1',
        deadline: futureDate,
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);
      mockPrismaService.classStudent.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if deadline passed and late submissions not allowed', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const dto = {
        activityId: 'activity-1',
        code: 'test',
        language: 'javascript',
      };

      const mockActivity = {
        id: 'activity-1',
        status: 'ATIVA',
        classId: null,
        deadline: pastDate,
        allowLateSubmission: false,
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated submissions for ALUNO', async () => {
      const query = { page: 1, limit: 10 };
      const userId = 'user-1';
      const role = 'ALUNO';

      const mockSubmissions = [
        {
          id: 'submission-1',
          userId: 'user-1',
          activity: { id: 'activity-1', title: 'Test', points: 100 },
          user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
        },
      ];

      mockPrismaService.submission.findMany.mockResolvedValue(mockSubmissions);
      mockPrismaService.submission.count.mockResolvedValue(1);

      const result = await service.findAll(query, userId, role);

      expect(result.data).toEqual(mockSubmissions);
      expect(result.meta.total).toBe(1);
      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    it('should return all submissions for ADMIN', async () => {
      const query = { page: 1, limit: 10 };
      const userId = 'admin-1';
      const role = 'ADMIN';

      mockPrismaService.submission.findMany.mockResolvedValue([]);
      mockPrismaService.submission.count.mockResolvedValue(0);

      await service.findAll(query, userId, role);

      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ userId: 'admin-1' }),
        }),
      );
    });

    it('should filter by activityId', async () => {
      const query = { page: 1, limit: 10, activityId: 'activity-1' };

      mockPrismaService.submission.findMany.mockResolvedValue([]);
      mockPrismaService.submission.count.mockResolvedValue(0);

      await service.findAll(query, 'user-1', 'ADMIN');

      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ activityId: 'activity-1' }),
        }),
      );
    });

    it('should filter by status', async () => {
      const query = {
        page: 1,
        limit: 10,
        status: SubmissionStatus.APROVADO,
      };

      mockPrismaService.submission.findMany.mockResolvedValue([]);
      mockPrismaService.submission.count.mockResolvedValue(0);

      await service.findAll(query, 'user-1', 'ADMIN');

      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: SubmissionStatus.APROVADO }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return submission for owner', async () => {
      const mockSubmission = {
        id: 'submission-1',
        userId: 'user-1',
        activity: { id: 'activity-1' },
        user: { id: 'user-1', name: 'Test' },
      };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);

      const result = await service.findOne('submission-1', 'user-1', 'ALUNO');

      expect(result).toEqual(mockSubmission);
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('invalid-id', 'user-1', 'ALUNO'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if ALUNO tries to view others submission', async () => {
      const mockSubmission = {
        id: 'submission-1',
        userId: 'user-2',
      };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);

      await expect(
        service.findOne('submission-1', 'user-1', 'ALUNO'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to view any submission', async () => {
      const mockSubmission = {
        id: 'submission-1',
        userId: 'user-2',
      };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);

      const result = await service.findOne('submission-1', 'admin-1', 'ADMIN');

      expect(result).toEqual(mockSubmission);
    });
  });

  describe('update', () => {
    it('should update submission', async () => {
      const dto = { status: SubmissionStatus.APROVADO, pointsEarned: 100 };
      const mockSubmission = { id: 'submission-1' };
      const mockUpdated = { id: 'submission-1', ...dto };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.submission.update.mockResolvedValue(mockUpdated);

      const result = await service.update('submission-1', dto);

      expect(result).toEqual(mockUpdated);
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete submission if owner', async () => {
      const mockSubmission = { id: 'submission-1', userId: 'user-1' };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.submission.delete.mockResolvedValue(mockSubmission);

      const result = await service.remove('submission-1', 'user-1', 'ALUNO');

      expect(result).toEqual({ message: 'Submission successfully deleted' });
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('invalid-id', 'user-1', 'ALUNO'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if ALUNO tries to delete others submission', async () => {
      const mockSubmission = { id: 'submission-1', userId: 'user-2' };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);

      await expect(
        service.remove('submission-1', 'user-1', 'ALUNO'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to delete any submission', async () => {
      const mockSubmission = { id: 'submission-1', userId: 'user-2' };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.submission.delete.mockResolvedValue(mockSubmission);

      const result = await service.remove('submission-1', 'admin-1', 'ADMIN');

      expect(result).toEqual({ message: 'Submission successfully deleted' });
    });
  });

  describe('execute', () => {
    it('should execute submission and update status', async () => {
      const mockSubmission = {
        id: 'submission-1',
        status: SubmissionStatus.PENDENTE,
        activity: {
          id: 'activity-1',
          points: 100,
          testCases: [{ id: 'test-1' }, { id: 'test-2' }],
        },
      };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.submission.update.mockResolvedValue({
        ...mockSubmission,
        status: SubmissionStatus.APROVADO,
      });

      const result = await service.execute('submission-1');

      expect(result.status).toBeDefined();
      expect(mockPrismaService.submission.update).toHaveBeenCalledTimes(2); // EXECUTANDO + result
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(service.execute('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if submission not pending', async () => {
      const mockSubmission = {
        id: 'submission-1',
        status: SubmissionStatus.APROVADO,
      };

      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);

      await expect(service.execute('submission-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockPrismaService.submission.count
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(18)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);

      mockPrismaService.submission.aggregate.mockResolvedValue({
        _sum: { pointsEarned: 1850 },
      });

      const result = await service.getUserStats('user-1');

      expect(result.totalSubmissions).toBe(25);
      expect(result.approved).toBe(18);
      expect(result.totalPoints).toBe(1850);
      expect(result.approvalRate).toBe('72.00');
    });
  });

  describe('getActivitySubmissions', () => {
    it('should return activity submissions with stats', async () => {
      const mockActivity = { id: 'activity-1' };
      const mockSubmissions = [
        { id: 'sub-1', status: SubmissionStatus.APROVADO },
        { id: 'sub-2', status: SubmissionStatus.PARCIAL },
      ];

      mockPrismaService.activity.findUnique.mockResolvedValue(mockActivity);
      mockPrismaService.submission.findMany.mockResolvedValue(mockSubmissions);

      const result = await service.getActivitySubmissions('activity-1');

      expect(result.submissions).toEqual(mockSubmissions);
      expect(result.stats.total).toBe(2);
      expect(result.stats.approved).toBe(1);
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue(null);

      await expect(
        service.getActivitySubmissions('invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
