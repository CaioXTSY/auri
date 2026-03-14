import api from '@/lib/api';

export interface Activity {
  id: string;
  classId?: string | null;
  title: string;
  description: string;
  type: 'EXERCICIO' | 'DESAFIO' | 'PROJETO' | 'QUIZ';
  difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
  points: number;
  deadline: string;
  starterCode?: string;
  status: 'ATIVA' | 'INATIVA';
  class?: {
    id: string;
    name: string;
    language?: string;
  };
  _count?: {
    testCases: number;
    submissions: number;
  };
  createdAt: string;
  testCases?: TestCase[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  points: number;
  isVisible: boolean;
  description?: string;
  createdAt: string;
}

export interface ActivityListResponse {
  data: Activity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateActivityDto {
  classId?: string;
  title: string;
  description: string;
  type: 'EXERCICIO' | 'DESAFIO' | 'PROJETO' | 'QUIZ';
  difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
  points: number;
  deadline?: string;
  starterCode?: string;
  allowLateSubmission?: boolean;
}

export interface CreateTestCaseDto {
  input: string;
  expectedOutput: string;
  points: number;
  isVisible: boolean;
  description?: string;
}

export const activityService = {
  createActivity: async (data: CreateActivityDto): Promise<Activity> => {
    const response = await api.post<Activity>('/activities', data);
    return response.data;
  },

  createTestCase: async (activityId: string, data: CreateTestCaseDto): Promise<void> => {
    await api.post(`/activities/${activityId}/test-cases`, data);
  },

  getActivitiesByClass: async (classId: string): Promise<ActivityListResponse> => {
    const response = await api.get<ActivityListResponse>('/activities', {
      params: { classId },
    });
    return response.data;
  },

  getActivity: async (id: string): Promise<Activity> => {
    const response = await api.get<Activity>(`/activities/${id}`);
    return response.data;
  },
};
