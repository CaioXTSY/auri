import api from '@/lib/api';

export interface AdminStats {
  users: { total: number; byRole: Record<string, number>; newLast7d: number; activeLast7d: number };
  classes: { total: number };
  missions: { byType: Record<string, number>; createdToday: number };
  posts: { total: number };
  achievements: { total: number };
  aiGenerations: { last7d: number };
  quiz: { totalAttempts: number; correctAttempts: number; accuracy: number };
  streaks: { averageCurrent: number };
}

export interface TimeseriesPoint {
  date: string;
  users: number;
  missions: number;
  correct: number;
  wrong: number;
}

export interface TopLists {
  topClasses: Array<{ id: string; name: string; label: string; students: number }>;
  topAchievements: Array<{ id: string; name: string; category: string; points: number; unlocks: number }>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  category: string;
  points: number;
  rarity: string;
  condition: string;
  createdAt: string;
  _count?: { userAchievements: number };
}

export interface CreateAchievementPayload {
  name: string;
  description: string;
  icon?: string;
  category: string;
  points: number;
  rarity?: string;
  condition: string;
}

export type UpdateAchievementPayload = Partial<CreateAchievementPayload>;

export interface AIGenerationListItem {
  id: string;
  type: string;
  createdAt: string;
  promptPreview: string;
}

export interface AIGenerationDetail {
  id: string;
  type: string;
  prompt: string;
  response: string;
  createdAt: string;
  missionQuizzes: Array<{ id: string; title: string; missionId: string; createdAt: string }>;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
  avatar: string | null;
  createdAt: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
}

export interface AdminMissionListItem {
  id: string;
  title: string;
  description: string;
  type: 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA';
  points: number;
  startDate: string;
  endDate: string;
  classId: string | null;
  createdAt: string;
}

export interface BroadcastPayload {
  type: 'SISTEMA' | 'CONQUISTA' | 'MISSAO' | 'RANKING';
  title: string;
  message: string;
  targetRole?: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>('/admin/stats');
    return data;
  },

  getTimeseries: async (): Promise<TimeseriesPoint[]> => {
    const { data } = await api.get<TimeseriesPoint[]>('/admin/stats/timeseries');
    return data;
  },

  getTopLists: async (): Promise<TopLists> => {
    const { data } = await api.get<TopLists>('/admin/stats/top');
    return data;
  },

  listAIGenerations: async (params: { page?: number; limit?: number; type?: string } = {}) => {
    const { data } = await api.get<Paginated<AIGenerationListItem>>('/admin/ai-generations', { params });
    return data;
  },

  getAIGeneration: async (id: string): Promise<AIGenerationDetail> => {
    const { data } = await api.get<AIGenerationDetail>(`/admin/ai-generations/${id}`);
    return data;
  },

  listAchievements: async (): Promise<Achievement[]> => {
    const { data } = await api.get<Achievement[]>('/admin/achievements');
    return data;
  },

  createAchievement: async (payload: CreateAchievementPayload): Promise<Achievement> => {
    const { data } = await api.post<Achievement>('/admin/achievements', payload);
    return data;
  },

  updateAchievement: async (id: string, payload: UpdateAchievementPayload): Promise<Achievement> => {
    const { data } = await api.patch<Achievement>(`/admin/achievements/${id}`, payload);
    return data;
  },

  deleteAchievement: async (id: string): Promise<void> => {
    await api.delete(`/admin/achievements/${id}`);
  },

  broadcast: async (payload: BroadcastPayload): Promise<{ count: number }> => {
    const { data } = await api.post<{ count: number }>('/admin/notifications/broadcast', payload);
    return data;
  },

  listUsers: async (params: { page?: number; limit?: number; role?: string; search?: string } = {}) => {
    const { data } = await api.get<Paginated<AdminUserListItem>>('/users', { params });
    return data;
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<AdminUserListItem> => {
    const { data } = await api.patch<AdminUserListItem>(`/users/${id}`, payload);
    return data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  listMissions: async () => {
    const { data } = await api.get<AdminMissionListItem[] | { data: AdminMissionListItem[] }>('/missions');
    return Array.isArray(data) ? data : data.data;
  },

  deleteMission: async (id: string): Promise<void> => {
    await api.delete(`/missions/${id}`);
  },

  deleteClass: async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },
};
