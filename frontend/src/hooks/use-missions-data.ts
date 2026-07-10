import { useCallback, useEffect, useState } from 'react';
import {
  missionsService,
  type Mission,
  type MissionStats,
  type UserMission,
} from '@/services/missions-service';

export const useMissionsData = () => {
  const [available, setAvailable] = useState<Mission[]>([]);
  const [history, setHistory] = useState<UserMission[]>([]);
  const [stats, setStats] = useState<MissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [availableResponse, historyResponse, statsResponse] = await Promise.all([
        missionsService.getAvailable(),
        missionsService.getMyHistory(),
        missionsService.getMyStats(),
      ]);
      setAvailable(availableResponse);
      setHistory(historyResponse.data);
      setStats(statsResponse);
    } catch {
      setError('Não foi possível carregar as missões.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const getRandomQuizMission = useCallback(async () => {
    setError(null);
    try {
      return await missionsService.getRandomQuizMission();
    } catch {
      setError('Não há uma questão aleatória disponível para você agora.');
      throw new Error('Não há uma questão aleatória disponível para você agora.');
    }
  }, []);

  const completeMission = useCallback(async (missionId: string) => {
    setError(null);
    try {
      await missionsService.completeMission(missionId);
      await loadData();
    } catch {
      setError('Não foi possível concluir a missão.');
      throw new Error('Não foi possível concluir a missão.');
    }
  }, [loadData]);

  return { available, history, stats, isLoading, error, loadData, getRandomQuizMission, completeMission };
};
