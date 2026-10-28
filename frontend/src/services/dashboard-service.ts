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
    nearby: Array<{
      position: number;
      points: number;
      user: {
        id: string;
        name: string;
        avatar?: string | null;
      };
    }>;
  };
  missions: MissionStats;
  streak: {
    current: number;
    longest: number;
    lastDate: string | null;
  };
}

export interface TeacherDashboard {
  totals: { classes: number; activeClasses: number; students: number };
  classes: Array<{
    id: string;
    name: string;
    year: number;
    status: string;
    studentCount: number;
    activityCount: number;
  }>;
  recentSubmissions: Array<{
    id: string;
    activityId: string;
    activityTitle: string;
    className: string;
    studentName: string;
    kind: 'ACTIVITY' | 'CODE';
    submittedAt: string;
    status: 'PENDING_REVIEW' | 'GRADED' | 'AUTOMATIC' | 'PROCESSING' | 'RETURNED' | 'ERROR';
  }>;
}

export const dashboardService = {
  getTeacherDashboard: async (): Promise<TeacherDashboard> => {
    const response = await api.get<TeacherDashboard>('/dashboard/teacher');
    return response.data;
  },
  getMyLevel: async (): Promise<LevelInfo> => {
    const response = await api.get<LevelInfo>('/gamification/level/me');
    return response.data;
  },

  getStudentDashboard: async (): Promise<StudentDashboard> => {
    const response = await api.get<StudentDashboard>('/dashboard/student');
    return response.data;
  },
};
