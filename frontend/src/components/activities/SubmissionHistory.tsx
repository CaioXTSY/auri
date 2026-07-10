import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CodeSubmission, CodeSubmissionStatus } from '@/services/programming-service';

const labels: Record<CodeSubmissionStatus, string> = {
  PENDING: 'Aguardando avaliação', RUNNING: 'Executando', ACCEPTED: 'Resposta correta',
  WRONG_ANSWER: 'Saída diferente', RUNTIME_ERROR: 'Erro de execução',
  TIME_LIMIT_EXCEEDED: 'Tempo excedido', MEMORY_LIMIT_EXCEEDED: 'Memória excedida',
  INTERNAL_ERROR: 'Falha interna da plataforma',
};

const tone = (status: CodeSubmissionStatus) => {
  if (status === 'ACCEPTED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'PENDING' || status === 'RUNNING') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'WRONG_ANSWER') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'INTERNAL_ERROR') return 'border-violet-200 bg-violet-50 text-violet-700';
  return 'border-red-200 bg-red-50 text-red-700';
};

export const SubmissionHistory = ({
  submissions,
  onSelect,
  compact = false,
}: {
  submissions: CodeSubmission[];
  onSelect: (submission: CodeSubmission) => void;
  compact?: boolean;
}) => (
  <section>
    <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
      <History className="h-4 w-4" />
      Histórico
    </div>
    {submissions.length === 0 ? (
      <p className="mt-3 text-sm text-slate-500">Nenhuma execução ainda.</p>
    ) : (
      <div className={cn('mt-3 space-y-2', compact && 'max-h-48 overflow-y-auto pr-1')}>
        {submissions.slice(0, compact ? 8 : 16).map((submission) => (
          <button
            key={submission.id}
            type="button"
            onClick={() => onSelect(submission)}
            className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-brand-200 hover:bg-slate-50"
          >
            <span className="min-w-0">
              <span className="block truncate text-slate-700">
                {new Date(submission.createdAt).toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-slate-500">
                {submission.mode === 'RUN' ? 'Execução dos exemplos' : 'Avaliação enviada'}
              </span>
            </span>
            <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold', tone(submission.status))}>
              {labels[submission.status]}
            </span>
          </button>
        ))}
      </div>
    )}
  </section>
);
