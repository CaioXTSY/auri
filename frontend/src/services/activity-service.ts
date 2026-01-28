import api from '@/lib/api';

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'EXERCISE' | 'CHALLENGE' | 'PROJECT' | 'QUIZ';
  difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
  points: number;
  deadline: string;
  status: 'ATIVA' | 'INATIVA';
  discipline?: {
    id: string;
    name: string;
    language: string;
  };
  class?: {
    id: string;
    name: string;
  };
  _count?: {
    testCases: number;
    submissions: number;
  };
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

export const activityService = {
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
