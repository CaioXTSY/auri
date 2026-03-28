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
}

export interface UserMission {
  id: string;
  status: MissionStatus;
  progress: number;
  completedAt?: string | null;
  startedAt: string;
  mission: Mission;
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

export const missionsService = {
  getAvailable: async (classId?: string): Promise<Mission[]> => {
    const response = await api.get<Mission[]>('/missions/available', {
      params: { classId },
    });
    return response.data;
  },

  getMyHistory: async (status?: MissionStatus, classId?: string): Promise<UserMission[]> => {
    const response = await api.get<UserMission[]>('/missions/my-missions', {
      params: { status, classId },
    });
    return response.data;
  },

  getMyStats: async (): Promise<MissionStats> => {
    const response = await api.get<MissionStats>('/missions/my-stats');
    return response.data;
  },

  startMission: async (missionId: string): Promise<void> => {
    await api.post(`/missions/${missionId}/start`);
  },

  updateProgress: async (missionId: string, progress: number): Promise<void> => {
    await api.patch(`/missions/${missionId}/progress`, { progress });
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
