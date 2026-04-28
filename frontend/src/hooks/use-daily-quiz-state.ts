import { useEffect, useMemo, useState } from 'react';
import { gamificationService, type UserStats } from '@/services/gamification-service';

interface UseDailyQuizStateProps {
  userId?: string;
  userRole?: string;
}

export const useDailyQuizState = ({ userId, userRole }: UseDailyQuizStateProps) => {
  const [showDailyQuiz, setShowDailyQuiz] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const dailyQuizKey = useMemo(() => {
    if (!userId) return null;
    const today = new Date().toISOString().slice(0, 10);
    return `auri-daily-quiz-${userId}-${today}`;
  }, [userId]);

  useEffect(() => {
    if (userRole !== 'ALUNO' || !dailyQuizKey) return;
    if (localStorage.getItem(dailyQuizKey)) return;

    const timeoutId = window.setTimeout(() => setShowDailyQuiz(true), 0);
    localStorage.setItem(dailyQuizKey, 'seen');
    return () => window.clearTimeout(timeoutId);
  }, [dailyQuizKey, userRole]);

  useEffect(() => {
    if (userRole !== 'ALUNO') return;

    const handleOpenDailyQuiz = () => setShowDailyQuiz(true);
    window.addEventListener('open-daily-quiz', handleOpenDailyQuiz);
    return () => window.removeEventListener('open-daily-quiz', handleOpenDailyQuiz);
  }, [userRole]);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      if (!userId || userRole !== 'ALUNO') return;
      try {
        const stats = await gamificationService.getMyStats();
        if (isMounted) setUserStats(stats);
      } catch {
        if (isMounted) setUserStats(null);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [userId, userRole]);

  const handleDailyQuizClose = () => {
    if (dailyQuizKey) {
      localStorage.setItem(dailyQuizKey, 'dismissed');
    }
    setShowDailyQuiz(false);
  };

  const handleDailyQuizAnswered = async () => {
    if (dailyQuizKey) {
      localStorage.setItem(dailyQuizKey, 'answered');
    }
    if (userRole !== 'ALUNO') return;

    try {
      const stats = await gamificationService.getMyStats();
      setUserStats(stats);
    } catch {
      setUserStats(null);
    }
  };

  return {
    showDailyQuiz,
    setShowDailyQuiz,
    userStats,
    handleDailyQuizClose,
    handleDailyQuizAnswered,
  };
};
