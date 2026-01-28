import api from '@/lib/api';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: 'COMUM' | 'RARO' | 'EPICO' | 'LENDARIO';
  unlockedAt?: string | null;
}

export interface AchievementProgress {
  unlocked: Achievement[];
  locked: Achievement[];
  total: number;
  unlockedCount: number;
  progress: number;
}

export interface RankingUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface RankingEntry {
  position: number;
  points: number;
  user: RankingUser;
}

export const gamificationService = {
  getMyAchievements: async (): Promise<AchievementProgress> => {
    const response = await api.get<AchievementProgress>('/gamification/achievements/me');
    return response.data;
  },

  getRanking: async (type: 'GLOBAL' | 'DISCIPLINA' | 'TURMA', referenceId?: string, limit = 50): Promise<RankingEntry[]> => {
    const response = await api.get<RankingEntry[]>('/gamification/ranking', {
      params: { type, referenceId, limit },
    });
    return response.data;
  },

  getMyStats: async () => {
    const response = await api.get('/gamification/stats/me');
    return response.data;
  }
};
