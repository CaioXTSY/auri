import api from '@/lib/api';

export interface Submission {
  id: string;
  activityId: string;
  userId: string;
  code: string;
  language: string;
  status: 'PENDENTE' | 'EXECUTANDO' | 'APROVADO' | 'PARCIAL' | 'REPROVADO' | 'ERRO';
  result?: string;
  executionTime?: number;
  memoryUsed?: number;
  pointsEarned: number;
  submittedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  activity: {
    id: string;
    title: string;
    points: number;
  };
}

export interface GetSubmissionsParams {
  page?: number;
  limit?: number;
  activityId?: string;
  userId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedSubmissions {
  data: Submission[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const submissionService = {
  getSubmissions: async (params?: GetSubmissionsParams): Promise<PaginatedSubmissions> => {
    const response = await api.get<PaginatedSubmissions>('/submissions', { params });
    return response.data;
  },

  getSubmissionById: async (id: string): Promise<Submission> => {
    const response = await api.get<Submission>(`/submissions/${id}`);
    return response.data;
  },
};
