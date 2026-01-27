import api from '@/lib/api';

export interface LevelInfo {
  userId: string;
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressToNextLevel: number;
}

export interface UpcomingActivity {
  id: string;
  title: string;
  disciplineName: string;
  deadline: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO';
}

export const dashboardService = {
  getMyLevel: async (): Promise<LevelInfo> => {
    const response = await api.get<LevelInfo>('/gamification/level/me');
    return response.data;
  },

  getUpcomingActivities: async (limit = 3): Promise<UpcomingActivity[]> => {
    const response = await api.get<UpcomingActivity[]>('/activities/upcoming', {
      params: { limit },
    });
    return response.data;
  },
};

