import api from '@/lib/api';

export type DailyQuizDifficulty = 'FACIL' | 'MEDIO' | 'DIFICIL';

export interface DailyQuiz {
  missionId: string;
  title: string;
  question: string;
  difficulty: DailyQuizDifficulty;
  points: number;
  options: string[];
}

export interface DailyQuizAnswerResponse {
  isCorrect: boolean;
  correctIndex: number;
  explanations: string[];
  selectedIndex: number;
  difficulty: DailyQuizDifficulty;
  pointsAwarded: number;
}

export const dailyQuizService = {
  getDailyQuiz: async (): Promise<DailyQuiz> => {
    const response = await api.get<DailyQuiz>('/missions/daily-quiz');
    return response.data;
  },

  answerQuiz: async (
    missionId: string,
    selectedIndex: number,
  ): Promise<DailyQuizAnswerResponse> => {
    const response = await api.post<DailyQuizAnswerResponse>(
      `/missions/${missionId}/quiz/answer`,
      { selectedIndex },
    );
    return response.data;
  },
};
