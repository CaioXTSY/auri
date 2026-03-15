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
  className: string;
  deadline: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO';
}

export interface AchievementSummary {
  id: string;
  name: string;
  description: string;
  icon?: string | null;
  points: number;
  rarity: string;
  category: string;
  unlockedAt?: string | null;
}

export interface MissionStats {
  total: number;
  completed: number;
  inProgress: number;
  expired: number;
  totalPoints: number;
  completionRate: number;
}

export interface SubmissionStats {
  totalSubmissions: number;
  approved: number;
  partial: number;
  rejected: number;
  pending: number;
  totalPoints: number;
  approvalRate: string | number;
}

export interface StudentDashboard {
  points: {
    total: number;
  };
  level: LevelInfo;
  achievements: {
    unlocked: number;
    total: number;
    progress: number;
    recent: AchievementSummary[];
  };
  ranking: {
    global: number | null;
    class: number | null;
    classId: string | null;
  };
  missions: MissionStats;
  submissions: SubmissionStats;
  upcomingActivities: UpcomingActivity[];
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

  getStudentDashboard: async (): Promise<StudentDashboard> => {
    const response = await api.get<StudentDashboard>('/dashboard/student');
    return response.data;
  },
};
