import api from '@/lib/api';

export type MissionType = 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA';
export type MissionStatus = 'NAO_INICIADA' | 'EM_PROGRESSO' | 'CONCLUIDA' | 'EXPIRADA';

export interface MissionClassInfo {
  id: string;
  name: string;
}

export interface MissionUserStatus {
  id: string;
  userId: string;
  status: MissionStatus;
  progress: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  points: number;
  startDate: string;
  endDate: string;
  class?: MissionClassInfo | null;
  userStatus?: MissionUserStatus | null;
  hasQuiz?: boolean;
}

export interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  status: MissionStatus;
  progress: number;
  completedAt?: string | null;
  startedAt: string;
  mission: Mission;
}

export interface UserMissionPage {
  data: UserMission[];
  total: number;
  page: number;
  limit: number;
}

export interface MissionStats {
  total: number;
  completed: number;
  inProgress: number;
  expired: number;
  totalPoints: number;
  completionRate: number;
}

export interface MissionQuizAttempt {
  selectedIndex: number;
  isCorrect: boolean;
  answeredAt: string;
}

export interface MissionQuiz {
  missionId: string;
  title: string;
  question: string;
  difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
  points: number;
  options: string[];
  answered: boolean;
  attempt: MissionQuizAttempt | null;
}

export interface MissionQuizAnswerResponse {
  isCorrect: boolean;
  correctIndex: number;
  explanations: string[];
  selectedIndex: number;
  difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
  pointsAwarded: number;
}

export interface RandomQuizMission {
  id: string;
  title: string;
  type: MissionType;
  points: number;
  class?: MissionClassInfo | null;
}

export const missionsService = {
  getAvailable: async (classId?: string): Promise<Mission[]> => {
    const response = await api.get<Mission[]>('/missions/available', {
      params: { classId },
    });
    return response.data;
  },

  getMyHistory: async (status?: MissionStatus, classId?: string, page = 1, limit = 20): Promise<UserMissionPage> => {
    const response = await api.get<UserMissionPage>('/missions/my-missions', {
      params: { status, classId, page, limit },
    });
    return response.data;
  },

  getMyStats: async (): Promise<MissionStats> => {
    const response = await api.get<MissionStats>('/missions/my-stats');
    return response.data;
  },

  getRandomQuizMission: async (): Promise<RandomQuizMission> => {
    const response = await api.get<RandomQuizMission>('/missions/random-quiz');
    return response.data;
  },

  startMission: async (missionId: string): Promise<void> => {
    await api.post(`/missions/${missionId}/start`);
  },

  completeMission: async (missionId: string): Promise<void> => {
    await api.post(`/missions/${missionId}/complete`);
  },

  getMissionQuiz: async (missionId: string): Promise<MissionQuiz> => {
    const response = await api.get<MissionQuiz>(`/missions/${missionId}/quiz`);
    return response.data;
  },

  answerMissionQuiz: async (
    missionId: string,
    selectedIndex: number,
  ): Promise<MissionQuizAnswerResponse> => {
    const response = await api.post<MissionQuizAnswerResponse>(
      `/missions/${missionId}/quiz/answer`,
      { selectedIndex },
    );
    return response.data;
  },
};
