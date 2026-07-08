import api from '@/lib/api';

export type ProgrammingLanguage = 'JAVASCRIPT' | 'PYTHON';
export type CodeSubmissionMode = 'RUN' | 'SUBMIT';
export type CodeSubmissionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';
export type Difficulty = 'FACIL' | 'MEDIO' | 'DIFICIL';
export type TestCaseVisibility = 'PUBLIC' | 'HIDDEN';

export interface ProgrammingClassInfo {
  id: string;
  name: string;
  year?: number;
}

export interface ProgrammingProblemSummary {
  id: string;
  title: string;
  statement: string;
  difficulty: Difficulty;
  allowedLanguages: ProgrammingLanguage[];
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface ProblemTestCase {
  id: string;
  problemId: string;
  input: string;
  expected: string;
  visibility: TestCaseVisibility;
  weight: number;
  createdAt?: string;
}

export interface ProgrammingProblem extends ProgrammingProblemSummary {
  starterCode: Partial<Record<ProgrammingLanguage, string>>;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  testCases?: ProblemTestCase[];
  assignments?: ProgrammingAssignment[];
  _count?: {
    testCases?: number;
    assignments?: number;
    submissions?: number;
  };
}

export interface ProgrammingAssignment {
  id: string;
  title: string;
  points: number;
  dueDate?: string | null;
  published: boolean;
  createdAt: string;
  problem: ProgrammingProblemSummary;
  class: ProgrammingClassInfo;
  submissions?: Array<Pick<CodeSubmission, 'id' | 'status' | 'score' | 'passedTests' | 'totalTests' | 'createdAt' | 'judgedAt'>>;
}

export interface PublicTestCase {
  id: string;
  input: string;
  expected: string;
  visibility: 'PUBLIC';
  weight: number;
}

export interface ProgrammingProblemSolve extends ProgrammingProblemSummary {
  starterCode: Partial<Record<ProgrammingLanguage, string>>;
  testCases: PublicTestCase[];
}

export interface ProgrammingAssignmentSolve extends Omit<ProgrammingAssignment, 'problem'> {
  problem: ProgrammingProblemSolve;
}

export interface SubmissionResult {
  id: string;
  status: CodeSubmissionStatus;
  visibility: 'PUBLIC' | 'HIDDEN';
  input?: string | null;
  expected?: string | null;
  actual?: string | null;
  errorMessage?: string | null;
  runtimeMs?: number | null;
}

export interface CodeSubmission {
  id: string;
  problemId: string;
  assignmentId?: string | null;
  userId: string;
  language: ProgrammingLanguage;
  code: string;
  mode: CodeSubmissionMode;
  status: CodeSubmissionStatus;
  score: number;
  pointsAwarded: number;
  passedTests: number;
  totalTests: number;
  runtimeMs?: number | null;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  judgedAt?: string | null;
  results?: SubmissionResult[];
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export interface SubmitAssignmentCodeDto {
  language: ProgrammingLanguage;
  code: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProgrammingProblemDto {
  title: string;
  statement: string;
  difficulty: Difficulty;
  allowedLanguages: ProgrammingLanguage[];
  starterCode: Partial<Record<ProgrammingLanguage, string>>;
  timeLimitMs: number;
  memoryLimitMb: number;
}

export type UpdateProgrammingProblemDto = Partial<CreateProgrammingProblemDto>;

export interface CreateProblemTestCaseDto {
  input: string;
  expected: string;
  visibility: TestCaseVisibility;
  weight: number;
}

export type UpdateProblemTestCaseDto = Partial<CreateProblemTestCaseDto>;

export interface CreateProgrammingAssignmentDto {
  problemId: string;
  classId: string;
  title: string;
  points: number;
  dueDate?: string | null;
  published: boolean;
}

export type UpdateProgrammingAssignmentDto = Partial<CreateProgrammingAssignmentDto>;

export interface RunnerStats {
  pending: number;
  running: number;
  stuckRunning: number;
  averageRuntimeMs: number;
  recentInternalErrors: Array<{
    id: string;
    language: ProgrammingLanguage;
    mode: CodeSubmissionMode;
    errorMessage?: string | null;
    createdAt: string;
    startedAt?: string | null;
    judgedAt?: string | null;
  }>;
  totalsByLanguage: Partial<Record<ProgrammingLanguage, number>>;
}

export const programmingService = {
  getProblems: async (page = 1, limit = 50): Promise<PaginatedResponse<ProgrammingProblem>> => {
    const response = await api.get<PaginatedResponse<ProgrammingProblem>>('/programming/problems', {
      params: { page, limit },
    });
    return response.data;
  },

  getProblem: async (problemId: string): Promise<ProgrammingProblem> => {
    const response = await api.get<ProgrammingProblem>(`/programming/problems/${problemId}`);
    return response.data;
  },

  createProblem: async (payload: CreateProgrammingProblemDto): Promise<ProgrammingProblem> => {
    const response = await api.post<ProgrammingProblem>('/programming/problems', payload);
    return response.data;
  },

  updateProblem: async (
    problemId: string,
    payload: UpdateProgrammingProblemDto,
  ): Promise<ProgrammingProblem> => {
    const response = await api.patch<ProgrammingProblem>(
      `/programming/problems/${problemId}`,
      payload,
    );
    return response.data;
  },

  createTestCase: async (
    problemId: string,
    payload: CreateProblemTestCaseDto,
  ): Promise<ProblemTestCase> => {
    const response = await api.post<ProblemTestCase>(
      `/programming/problems/${problemId}/test-cases`,
      payload,
    );
    return response.data;
  },

  updateTestCase: async (
    testCaseId: string,
    payload: UpdateProblemTestCaseDto,
  ): Promise<ProblemTestCase> => {
    const response = await api.patch<ProblemTestCase>(
      `/programming/test-cases/${testCaseId}`,
      payload,
    );
    return response.data;
  },

  deleteTestCase: async (testCaseId: string): Promise<void> => {
    await api.delete(`/programming/test-cases/${testCaseId}`);
  },

  getAssignments: async (
    page = 1,
    limit = 50,
  ): Promise<PaginatedResponse<ProgrammingAssignment>> => {
    const response = await api.get<PaginatedResponse<ProgrammingAssignment>>(
      '/programming/assignments',
      { params: { page, limit } },
    );
    return response.data;
  },

  getAssignment: async (assignmentId: string): Promise<ProgrammingAssignment> => {
    const response = await api.get<ProgrammingAssignment>(
      `/programming/assignments/${assignmentId}`,
    );
    return response.data;
  },

  createAssignment: async (
    payload: CreateProgrammingAssignmentDto,
  ): Promise<ProgrammingAssignment> => {
    const response = await api.post<ProgrammingAssignment>('/programming/assignments', payload);
    return response.data;
  },

  updateAssignment: async (
    assignmentId: string,
    payload: UpdateProgrammingAssignmentDto,
  ): Promise<ProgrammingAssignment> => {
    const response = await api.patch<ProgrammingAssignment>(
      `/programming/assignments/${assignmentId}`,
      payload,
    );
    return response.data;
  },

  deleteAssignment: async (assignmentId: string): Promise<void> => {
    await api.delete(`/programming/assignments/${assignmentId}`);
  },

  getAssignmentSubmissions: async (assignmentId: string): Promise<CodeSubmission[]> => {
    const response = await api.get<CodeSubmission[]>(
      `/programming/assignments/${assignmentId}/submissions`,
    );
    return response.data;
  },

  getRunnerStats: async (): Promise<RunnerStats> => {
    const response = await api.get<RunnerStats>('/programming/runner/stats');
    return response.data;
  },

  getMyAssignments: async (): Promise<ProgrammingAssignment[]> => {
    const response = await api.get<ProgrammingAssignment[]>('/programming/assignments/my');
    return response.data;
  },

  getSolveAssignment: async (assignmentId: string): Promise<ProgrammingAssignmentSolve> => {
    const response = await api.get<ProgrammingAssignmentSolve>(
      `/programming/assignments/${assignmentId}/solve`,
    );
    return response.data;
  },

  runAssignment: async (
    assignmentId: string,
    payload: SubmitAssignmentCodeDto,
  ): Promise<CodeSubmission> => {
    const response = await api.post<CodeSubmission>(
      `/programming/assignments/${assignmentId}/run`,
      payload,
    );
    return response.data;
  },

  submitAssignment: async (
    assignmentId: string,
    payload: SubmitAssignmentCodeDto,
  ): Promise<CodeSubmission> => {
    const response = await api.post<CodeSubmission>(
      `/programming/assignments/${assignmentId}/submit`,
      payload,
    );
    return response.data;
  },

  getSubmission: async (submissionId: string): Promise<CodeSubmission> => {
    const response = await api.get<CodeSubmission>(`/programming/submissions/${submissionId}`);
    return response.data;
  },

  getMySubmissions: async (assignmentId: string): Promise<CodeSubmission[]> => {
    const response = await api.get<CodeSubmission[]>(
      `/programming/assignments/${assignmentId}/submissions/my`,
    );
    return response.data;
  },
};
