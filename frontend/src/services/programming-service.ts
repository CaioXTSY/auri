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

export interface ProgrammingClassInfo {
  id: string;
  name: string;
  year?: number;
}

export interface ProgrammingProblemSummary {
  id: string;
  title: string;
  statement: string;
  difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
  allowedLanguages: ProgrammingLanguage[];
  timeLimitMs: number;
  memoryLimitMb: number;
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
}

export interface SubmitAssignmentCodeDto {
  language: ProgrammingLanguage;
  code: string;
}

export const programmingService = {
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

