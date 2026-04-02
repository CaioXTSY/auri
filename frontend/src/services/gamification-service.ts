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
  isUnlocked?: boolean;
}

export interface PaginatedAchievements {
  data: Achievement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    totalUnlocked: number;
    totalAchievements: number;
  };
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

export interface UserStats {
  userId: string;
  level: number;
  levelName: string;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
  achievementsCount: number;
  totalAchievements: number;
  currentStreak: number;
  longestStreak: number;
}

export const gamificationService = {
  getMyAchievements: async (page = 1, limit = 10, filter: 'ALL' | 'UNLOCKED' | 'LOCKED' = 'ALL'): Promise<PaginatedAchievements> => {
    const response = await api.get<PaginatedAchievements>('/gamification/achievements/me', {
      params: { page, limit, filter }
    });
    return response.data;
  },

  getRanking: async (type: 'GLOBAL' | 'TURMA', referenceId?: string, limit = 50): Promise<RankingEntry[]> => {
    const response = await api.get<RankingEntry[]>('/gamification/ranking', {
      params: { type, referenceId, limit },
    });
    return response.data;
  },

  getMyStats: async (): Promise<UserStats> => {
    const response = await api.get<{
      points: { total: number };
      level: {
        userId: string;
        totalPoints: number;
        currentLevel: number;
        levelName: string;
        pointsInCurrentLevel: number;
        pointsNeededForNextLevel: number;
        progressToNextLevel: number;
      };
      achievements: { unlocked: number; total: number; progress: number };
      ranking: { global: number | null; points: number };
      streak: { current: number; longest: number; lastDate: string | null };
    }>('/gamification/stats/me');
    const { level, achievements, streak } = response.data;
    return {
      userId: level.userId,
      level: level.currentLevel,
      levelName: level.levelName,
      currentXp: level.totalPoints,
      nextLevelXp: level.pointsInCurrentLevel + level.pointsNeededForNextLevel,
      progress: level.progressToNextLevel,
      achievementsCount: achievements.unlocked,
      totalAchievements: achievements.total,
      currentStreak: streak?.current ?? 0,
      longestStreak: streak?.longest ?? 0,
    };
  }
};
