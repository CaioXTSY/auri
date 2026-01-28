import api from '@/lib/api';

export interface Submission {
  id: string;
  activityId: string;
  userId: string;
  code: string;
  language: string;
  status: 'PENDENTE' | 'EXECUTANDO' | 'APROVADO' | 'PARCIAL' | 'REPROVADO' | 'ERRO';
  result: string | null;
  executionTime: number | null;
  memoryUsed: number | null;
  pointsEarned: number;
  submittedAt: string;
}

export interface CreateSubmissionDto {
  activityId: string;
  code: string;
  language: string;
}

export const submissionService = {
  createSubmission: async (data: CreateSubmissionDto): Promise<Submission> => {
    const response = await api.post<Submission>('/submissions', data);
    return response.data;
  },

  getMySubmissions: async (activityId: string): Promise<Submission[]> => {
    const response = await api.get<{ data: Submission[] }>('/submissions', {
      params: { activityId },
    });
    return response.data.data;
  },
};
