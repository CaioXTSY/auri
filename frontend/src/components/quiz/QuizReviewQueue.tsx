import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { SectionCard } from '@/components/ui/section-card';
import { Button } from '@/components/ui/button';

type PendingQuiz = { id: string; missionId: string; title: string; question: string; options: string[]; explanations: string[]; correctIndex: number; difficulty: string };
export function QuizReviewQueue() {
  const [quizzes, setQuizzes] = useState<PendingQuiz[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const reload = async () => {
    try { setQuizzes((await api.get<PendingQuiz[]>('/missions/quiz-review/pending')).data); }
    catch { setError('Não foi possível carregar a fila de revisão.'); }
  };
  useEffect(() => { void reload(); }, []);
  const decide = async (quiz: PendingQuiz, decision: 'APPROVED' | 'REJECTED') => {
    setBusy(quiz.id); setError('');
    try {
      await api.post(`/missions/${quiz.missionId}/quiz/review`, { decision, reason: reasons[quiz.id]?.trim() });
      await reload();
    } catch { setError('Não foi possível registrar a decisão. Informe uma justificativa e confira se o quiz ainda está pendente.'); }
    finally { setBusy(null); }
  };
  return <SectionCard className="p-4 space-y-4">
    <h2 className="text-lg font-semibold">Revisão de quizzes</h2>
    <p className="text-sm text-slate-600">Questões pendentes ficam indisponíveis aos alunos. Examine o enunciado, todas as opções e explicações antes de decidir. A análise automática não substitui revisão pedagógica.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!quizzes.length && <p className="text-sm">Nenhuma questão pendente.</p>}
    {quizzes.map((quiz) => <article key={quiz.id} className="border rounded p-4 space-y-3">
      <h3 className="font-semibold">{quiz.title} ({quiz.difficulty})</h3>
      <pre className="whitespace-pre-wrap font-sans text-sm">{quiz.question}</pre>
      <ol className="space-y-2">{quiz.options.map((option, i) => <li key={i}>
        <p className="font-medium">{'ABCD'[i]}. {option} {quiz.correctIndex === i ? '— Gabarito' : ''}</p>
        <p className="text-sm text-slate-600">{quiz.explanations[i]}</p>
      </li>)}</ol>
      <label className="block text-sm">Justificativa da decisão
        <textarea aria-label={`Justificativa: ${quiz.title}`} className="block w-full border rounded p-2" value={reasons[quiz.id] ?? ''} onChange={(e) => setReasons({ ...reasons, [quiz.id]: e.target.value })} maxLength={2000} />
      </label>
      <div className="flex gap-2">
        <Button disabled={busy !== null || (reasons[quiz.id]?.trim().length ?? 0) < 3} onClick={() => void decide(quiz, 'APPROVED')}>Aprovar e publicar</Button>
        <Button variant="outline" disabled={busy !== null || (reasons[quiz.id]?.trim().length ?? 0) < 3} onClick={() => void decide(quiz, 'REJECTED')}>Rejeitar</Button>
      </div>
    </article>)}
  </SectionCard>;
}
