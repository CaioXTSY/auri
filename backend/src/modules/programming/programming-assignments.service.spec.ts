import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProgrammingAssignmentsService } from './programming-assignments.service';

describe('ProgrammingAssignmentsService', () => {
  let service: ProgrammingAssignmentsService;

  const mockPrismaService = {
    programmingAssignment: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    programmingProblem: {
      findUnique: jest.fn(),
    },
    problemTestCase: {
      count: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgrammingAssignmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProgrammingAssignmentsService>(ProgrammingAssignmentsService);

    jest.clearAllMocks();
  });

  it('should list only published student assignments from classes with activities enabled', async () => {
    mockPrismaService.programmingAssignment.findMany.mockResolvedValue([]);

    await service.findMyAssignments('student-1');

    expect(mockPrismaService.programmingAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          published: true,
          class: {
            settings: {
              is: { activitiesEnabled: true },
            },
            students: {
              some: { userId: 'student-1' },
            },
          },
        },
      }),
    );
  });

  it('should not open solve view when assignment is unpublished, inaccessible or disabled', async () => {
    mockPrismaService.programmingAssignment.findFirst.mockResolvedValue(null);

    await expect(service.getSolveView('assignment-1', 'student-1')).rejects.toThrow(
      NotFoundException,
    );

    expect(mockPrismaService.programmingAssignment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'assignment-1',
          published: true,
          class: {
            settings: {
              is: { activitiesEnabled: true },
            },
            students: {
              some: { userId: 'student-1' },
            },
          },
        },
      }),
    );
  });

  it('should restrict professor assignment list to classes they created', async () => {
    mockPrismaService.programmingAssignment.findMany.mockResolvedValue([]);
    mockPrismaService.programmingAssignment.count.mockResolvedValue(0);

    await service.findAll('teacher-1', Role.PROFESSOR);

    expect(mockPrismaService.programmingAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          class: { createdById: 'teacher-1' },
        },
      }),
    );
  });
});
