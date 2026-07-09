import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  CodeSubmissionMode,
  CodeSubmissionStatus,
  ProgrammingLanguage,
  Role,
  TestCaseVisibility,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CodeSubmissionsService } from './code-submissions.service';

describe('CodeSubmissionsService', () => {
  let service: CodeSubmissionsService;

  const mockPrismaService = {
    codeSubmission: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    programmingProblem: {
      findUnique: jest.fn(),
    },
    programmingAssignment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const assignmentForSubmission = {
    id: 'assignment-1',
    problemId: 'problem-1',
    dueDate: null as Date | null,
    class: {
      settings: {
        allowLateSubmissions: false,
      },
    },
    problem: {
      id: 'problem-1',
      allowedLanguages: [ProgrammingLanguage.PYTHON],
    },
  };

  beforeEach(() => {
    service = new CodeSubmissionsService(mockPrismaService as unknown as PrismaService);
    jest.clearAllMocks();
  });

  it('should reject official submission after due date when late submissions are disabled', async () => {
    mockPrismaService.programmingAssignment.findFirst.mockResolvedValue({
      ...assignmentForSubmission,
      dueDate: new Date(Date.now() - 60_000),
      class: {
        settings: {
          allowLateSubmissions: false,
        },
      },
    });

    await expect(
      service.submitAssignment('student-1', 'assignment-1', {
        language: ProgrammingLanguage.PYTHON,
        code: 'def solve(input: str) -> str:\n    return "ok"',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrismaService.codeSubmission.create).not.toHaveBeenCalled();
  });

  it('should allow official submission after due date when class allows late submissions', async () => {
    const createdSubmission = { id: 'submission-1' };
    mockPrismaService.programmingAssignment.findFirst.mockResolvedValue({
      ...assignmentForSubmission,
      dueDate: new Date(Date.now() - 60_000),
      class: {
        settings: {
          allowLateSubmissions: true,
        },
      },
    });
    mockPrismaService.codeSubmission.create.mockResolvedValue(createdSubmission);

    const result = await service.submitAssignment('student-1', 'assignment-1', {
      language: ProgrammingLanguage.PYTHON,
      code: 'def solve(input: str) -> str:\n    return "ok"',
    });

    expect(result).toEqual(createdSubmission);
    expect(mockPrismaService.codeSubmission.create).toHaveBeenCalledWith({
      data: {
        userId: 'student-1',
        assignmentId: 'assignment-1',
        problemId: 'problem-1',
        language: ProgrammingLanguage.PYTHON,
        code: 'def solve(input: str) -> str:\n    return "ok"',
        mode: CodeSubmissionMode.SUBMIT,
        status: CodeSubmissionStatus.PENDING,
      },
    });
  });

  it('should require enabled activities and student enrollment before creating run submission', async () => {
    mockPrismaService.programmingAssignment.findFirst.mockResolvedValue(null);

    await expect(
      service.runAssignmentExamples('student-1', 'assignment-1', {
        language: ProgrammingLanguage.PYTHON,
        code: 'def solve(input: str) -> str:\n    return "ok"',
      }),
    ).rejects.toThrow(NotFoundException);

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

  it('should hide input, expected, actual and error from hidden tests for students', async () => {
    mockPrismaService.programmingAssignment.findFirst.mockResolvedValue({
      id: 'assignment-1',
    });
    mockPrismaService.codeSubmission.findMany.mockResolvedValue([
      {
        id: 'submission-1',
        results: [
          {
            id: 'result-public',
            status: CodeSubmissionStatus.ACCEPTED,
            inputPreview: '2 3',
            expected: '5',
            actual: '5',
            errorMessage: null,
            runtimeMs: 12,
            testCase: { visibility: TestCaseVisibility.PUBLIC },
          },
          {
            id: 'result-hidden',
            status: CodeSubmissionStatus.WRONG_ANSWER,
            inputPreview: '10 20',
            expected: '30',
            actual: '0',
            errorMessage: 'hidden failure',
            runtimeMs: 10,
            testCase: { visibility: TestCaseVisibility.HIDDEN },
          },
        ],
      },
    ]);

    const [submission] = await service.findMyAssignmentSubmissions('student-1', 'assignment-1');

    expect(submission.results).toEqual([
      expect.objectContaining({
        id: 'result-public',
        visibility: TestCaseVisibility.PUBLIC,
        input: '2 3',
        expected: '5',
        actual: '5',
      }),
      {
        id: 'result-hidden',
        status: CodeSubmissionStatus.WRONG_ANSWER,
        visibility: TestCaseVisibility.HIDDEN,
        runtimeMs: 10,
      },
    ]);
  });

  it('should block professor from viewing submissions from another teacher class', async () => {
    mockPrismaService.programmingAssignment.findUnique.mockResolvedValue({
      id: 'assignment-1',
      class: { createdById: 'teacher-owner' },
    });

    await expect(
      service.findByAssignment('assignment-1', 'teacher-other', Role.PROFESSOR),
    ).rejects.toThrow(ForbiddenException);
  });
});
