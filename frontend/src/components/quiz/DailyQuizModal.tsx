import { useEffect, useMemo, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { cn } from '@/lib/utils';
import { dailyQuizService, type DailyQuiz, type DailyQuizAnswerResponse } from '@/services/daily-quiz-service';
import { useAuthStore } from '@/stores/auth-store';

interface DailyQuizModalProps {
  open: boolean;
  onClose: () => void;
  onAnswered: () => void;
}

export const DailyQuizModal = ({ open, onClose, onAnswered }: DailyQuizModalProps) => {
  const user = useAuthStore((state) => state.user);
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<DailyQuizAnswerResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const loadQuiz = async () => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setSelectedIndex(null);
      try {
        const response = user?.id
          ? await dailyQuizService.getDailyQuizForUser()
          : await dailyQuizService.getDailyQuiz();
        if (!isMounted) return;
        setQuiz(response);
        if (response.answered && response.attempt) {
          setSelectedIndex(response.attempt.selectedIndex);
          setResult({
            isCorrect: response.attempt.isCorrect,
            correctIndex: response.correctIndex ?? 0,
            explanations: response.explanations ?? [],
            selectedIndex: response.attempt.selectedIndex,
            difficulty: response.difficulty,
            pointsAwarded: response.pointsAwarded ?? 0,
          });
        }
      } catch {
        if (!isMounted) return;
        setError('Não foi possível carregar o quiz diário.');
        setQuiz(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadQuiz();

    return () => {
      isMounted = false;
    };
  }, [open, user?.id]);

  const difficultyLabel = useMemo(() => {
    if (!quiz) return null;
    if (quiz.difficulty === 'FACIL') return 'Fácil';
    if (quiz.difficulty === 'MEDIO') return 'Médio';
    return 'Difícil';
  }, [quiz]);

  const difficultyClasses = useMemo(() => {
    if (!quiz) return '';
    if (quiz.difficulty === 'FACIL') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (quiz.difficulty === 'MEDIO') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  }, [quiz]);

  const handleAnswer = async () => {
    if (!quiz || selectedIndex == null || isSubmitting || result) return;
    if (!user?.id) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await dailyQuizService.answerQuiz(quiz.missionId, selectedIndex);
      setResult(response);
      onAnswered();
    } catch (submitError) {
      const errorResponse = submitError as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = errorResponse.response?.status;
      const message = errorResponse.response?.data?.message;
      if (status === 401 || status === 403) {
        setError('Sessão expirada. Faça login novamente.');
        return;
      }
      if (typeof message === 'string') {
        setError(message);
        return;
      }
      setError('Não foi possível enviar sua resposta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-slate-950/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)] overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/80 text-slate-500 flex items-center justify-center hover:bg-white transition-colors z-20"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 py-8 sm:px-8 sm:py-10 space-y-5">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-brand-900 text-accent-400 flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500 font-semibold">
                Quiz diário
              </p>
              <h2 className="text-2xl font-display font-bold text-brand-900">
                {quiz?.title || 'Pergunta do dia'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {quiz && (
                  <>
                    <span className={cn('px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide', difficultyClasses)}>
                      {difficultyLabel}
                    </span>
                    <span className="px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 font-semibold uppercase tracking-wide">
                      {quiz.points} XP
                    </span>
                  </>
                )}
                {!quiz && (
                  <span className="px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 font-semibold uppercase tracking-wide">
                    Novo desafio
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-2" />
          <div className="space-y-5">
            {isLoading && (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              </div>
            )}

            {!isLoading && error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {!isLoading && quiz && (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700 text-sm leading-relaxed">
                  <MarkdownContent content={quiz.question} />
                </div>

                <div className="grid gap-2.5">
                  {quiz.options.map((option, index) => {
                    const isSelected = selectedIndex === index;
                    const isAnswered = Boolean(result);
                    const isCorrect = result?.correctIndex === index;
                    const isWrong = isAnswered && result?.selectedIndex === index && !isCorrect;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        disabled={Boolean(result)}
                        className={cn(
                          'w-full text-left rounded-xl border px-4 py-3 transition-all group',
                          isSelected && !isAnswered && 'border-brand-900 bg-brand-50',
                          !isSelected && !isAnswered && 'border-slate-200 hover:border-brand-300 hover:bg-slate-50',
                          isCorrect && 'border-emerald-400 bg-emerald-50',
                          isWrong && 'border-rose-400 bg-rose-50',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className={cn(
                            'mt-0.5 h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold',
                            isCorrect && 'border-emerald-500 text-emerald-600',
                            isWrong && 'border-rose-500 text-rose-600',
                            !isAnswered && 'border-slate-300 text-slate-500 group-hover:border-brand-400 group-hover:text-brand-700',
                          )}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <div className="flex-1 space-y-2">
                            <span className="text-sm font-semibold text-slate-800">
                              {option}
                            </span>
                            {result && (
                              <div className="text-xs text-slate-600 leading-relaxed">
                                <MarkdownContent content={String(result.explanations?.[index] || '')} />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {result && (
                  <div className="space-y-3">
                    <div
                      className={cn(
                        'rounded-xl border px-4 py-3 text-sm font-semibold',
                        result.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700',
                      )}
                    >
                      {result.isCorrect
                        ? `Resposta correta! Você ganhou ${result.pointsAwarded} XP.`
                        : 'Resposta incorreta. Veja as explicações e tente amanhã.'}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200 text-slate-600"
                        onClick={onClose}
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>
                )}

                {!result && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {user?.role === 'ALUNO' ? (
                      <Button
                        type="button"
                        className="bg-brand-900 hover:bg-brand-800 text-white font-semibold"
                        onClick={handleAnswer}
                        disabled={selectedIndex == null || isSubmitting || Boolean(result)}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          'Responder agora'
                        )}
                      </Button>
                    ) : (
                      <div className="text-sm text-slate-500">
                        Apenas alunos podem responder o quiz diário.
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-200 text-slate-600"
                      onClick={onClose}
                    >
                      Ver depois
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
