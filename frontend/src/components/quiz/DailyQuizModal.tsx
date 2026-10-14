import { useEffect, useMemo, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { ModalDialog } from '@/components/ui/modal-dialog';
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
        } catch (loadError) {
        if (!isMounted) return;
          const status = (loadError as { response?: { status?: number } }).response?.status;
          setError(status === 404 ? 'O quiz diário ainda não está disponível. Questões geradas podem estar aguardando revisão de um responsável.' : 'Não foi possível carregar o quiz diário.');
        setQuiz(null);
      } finally {
        if (isMounted) setIsLoading(false);
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
      } else if (typeof message === 'string') {
        setError(message);
      } else {
        setError('Não foi possível enviar sua resposta.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      title={quiz?.title || 'Pergunta do dia'}
      description="Responda o quiz diário para acumular XP e manter sua sequência ativa."
      onClose={onClose}
      panelClassName="max-w-3xl"
      initialFocusSelector="[data-dialog-close]"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-900 text-accent-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Quiz diário</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {quiz ? (
                <>
                  <span className={cn('rounded-full border px-2.5 py-1 font-semibold uppercase tracking-wide', difficultyClasses)}>
                    {difficultyLabel}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold uppercase tracking-wide text-slate-500">
                    {quiz.points} XP
                  </span>
                </>
              ) : (
                <span className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold uppercase tracking-wide text-slate-500">
                  Novo desafio
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            data-dialog-close
            aria-label="Fechar quiz diário"
            onClick={onClose}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {!isLoading && quiz ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-700">
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
                      'group w-full rounded-xl border px-4 py-3 text-left transition-all',
                      isSelected && !isAnswered && 'border-brand-900 bg-brand-50',
                      !isSelected && !isAnswered && 'border-slate-200 hover:border-brand-300 hover:bg-slate-50',
                      isCorrect && 'border-emerald-400 bg-emerald-50',
                      isWrong && 'border-rose-400 bg-rose-50',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold',
                          isCorrect && 'border-emerald-500 text-emerald-600',
                          isWrong && 'border-rose-500 text-rose-600',
                          !isAnswered && 'border-slate-300 text-slate-500 group-hover:border-brand-400 group-hover:text-brand-700',
                        )}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1 space-y-2">
                        <span className="text-sm font-semibold text-slate-800">{option}</span>
                        {result ? (
                          <div className="text-xs leading-relaxed text-slate-600">
                            <MarkdownContent content={String(result.explanations?.[index] || '')} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {result ? (
              <div className="space-y-3">
                <div
                  className={cn(
                    'rounded-xl border px-4 py-3 text-sm font-semibold',
                    result.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700',
                  )}
                >
                  {result.isCorrect
                    ? `Resposta correta! Você ganhou ${result.pointsAwarded} XP.`
                    : 'Resposta incorreta. Veja as explicações e continue praticando nos próximos desafios.'}
                </div>
                {result.isCorrect && result.newStreak && result.newStreak > 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                    <span className="text-2xl leading-none">🔥</span>
                    <div>
                      <p className="font-bold">Sequência: {result.newStreak} {result.newStreak === 1 ? 'dia' : 'dias'}!</p>
                      <p className="text-xs text-orange-600">
                        {result.newStreak >= 7 ? 'Incrível! Você está em chamas!' : 'Continue amanhã para aumentar sua sequência!'}
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className="flex justify-end">
                  <Button type="button" variant="outline" className="border-slate-200 text-slate-600" onClick={onClose}>
                    Fechar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {user?.role === 'ALUNO' ? (
                  <Button type="button" className="bg-brand-900 font-semibold text-white hover:bg-brand-800" onClick={handleAnswer} disabled={selectedIndex == null || isSubmitting || Boolean(result)}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Responder agora'}
                  </Button>
                ) : (
                  <div className="text-sm text-slate-500">Apenas alunos podem responder o quiz diário.</div>
                )}
                <Button type="button" variant="outline" className="border-slate-200 text-slate-600" onClick={onClose}>
                  Ver depois
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </ModalDialog>
  );
};
