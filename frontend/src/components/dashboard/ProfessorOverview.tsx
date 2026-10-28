import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, ListChecks, MessageSquare, Plus, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardService, type TeacherDashboard } from '@/services/dashboard-service';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface ProfessorOverviewProps {
  firstName: string;
}

const submissionStyles: Record<TeacherDashboard['recentSubmissions'][number]['status'], { label: string; className: string }> = {
  PENDING_REVIEW: { label: 'A corrigir', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  GRADED: { label: 'Corrigida', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  AUTOMATIC: { label: 'Auto', className: 'border-blue-200 bg-blue-50 text-blue-800' },
  PROCESSING: { label: 'Avaliando', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  RETURNED: { label: 'Devolvida', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  ERROR: { label: 'Falha na avaliação', className: 'border-red-200 bg-red-50 text-red-800' },
};

const actionClass = 'inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';
const primaryActionClass = cn(actionClass, 'border-brand-900 bg-brand-900 text-white hover:bg-brand-800');

export const ProfessorOverview = ({ firstName }: ProfessorOverviewProps) => {
  const userId = useAuthStore((state) => state.user?.id);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['teacher-dashboard', userId],
    queryFn: dashboardService.getTeacherDashboard,
    enabled: Boolean(userId),
  });

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600">Painel do Professor</p>
          <h2 className="mt-1 font-display text-xl font-bold text-brand-900">Bem-vindo, {firstName}.</h2>
          <p className="mt-1 text-xs text-slate-600">Gerencie suas turmas e acompanhe os alunos abaixo.</p>
        </div>
        <Link to="/dashboard/teacher/classes/new" className={primaryActionClass} data-tour="teacher-new-class">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Nova Turma
        </Link>
      </section>

      {isError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>Não foi possível carregar o painel do professor.</span>
          <button type="button" onClick={() => void refetch()} className="font-semibold underline underline-offset-2">Tentar novamente</button>
        </div>
      ) : null}

      <section aria-label="Resumo das turmas" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600"><BookOpen className="h-3 w-3" aria-hidden="true" /> Turmas</p>
          {isPending ? <Skeleton className="mt-2 h-9 w-16" /> : <p className="mt-2 font-display text-3xl font-bold tabular-nums text-brand-900">{data?.totals.classes ?? '—'}</p>}
          <p className="mt-1 text-xs text-slate-600">{data ? `${data.totals.activeClasses} ativa${data.totals.activeClasses !== 1 ? 's' : ''}` : 'Turmas ativas'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600"><Users className="h-3 w-3" aria-hidden="true" /> Alunos</p>
          {isPending ? <Skeleton className="mt-2 h-9 w-16" /> : <p className="mt-2 font-display text-3xl font-bold tabular-nums text-brand-900">{data?.totals.students ?? '—'}</p>}
          <p className="mt-1 text-xs text-slate-600">matriculados no total</p>
        </div>
        <Link to="/dashboard/posts" className="block rounded-xl border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600"><MessageSquare className="h-3 w-3" aria-hidden="true" /> Postagens</p>
          <p className="mt-2 font-display text-2xl font-bold text-brand-900">Mural</p>
          <p className="mt-2 text-xs text-slate-600">avisos e discussões por turma</p>
        </Link>
      </section>

      <section className="space-y-3" aria-labelledby="teacher-classes-heading">
        <div className="flex items-center justify-between gap-3">
          <h3 id="teacher-classes-heading" className="font-display text-sm font-bold text-brand-900">Suas Turmas</h3>
          <Link to="/dashboard/teacher/classes" className="text-xs font-medium text-brand-600 hover:underline">Ver todas →</Link>
        </div>
        {isPending ? (
          <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-40 rounded-xl" />)}</div>
        ) : data?.classes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            Você ainda não criou nenhuma turma. <Link to="/dashboard/teacher/classes/new" className="font-semibold text-brand-700 underline">Criar turma</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {data?.classes.slice(0, 3).map((classroom) => (
              <article key={classroom.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${classroom.status === 'ATIVA' ? 'border-blue-100 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{classroom.year}</span>
                  <span className={`h-2 w-2 rounded-full ${classroom.status === 'ATIVA' ? 'bg-emerald-500' : 'bg-slate-300'}`} role="img" aria-label={classroom.status === 'ATIVA' ? 'Turma ativa' : 'Turma encerrada'} />
                </div>
                <h4 className="mt-3 break-words text-sm font-bold text-brand-900">{classroom.name}</h4>
                <p className="mt-1 text-xs text-slate-600">{classroom.studentCount} aluno{classroom.studentCount !== 1 ? 's' : ''}</p>
                <div className="mt-3 flex flex-1 items-end justify-between gap-3 border-t border-slate-100 pt-3">
                  <p className="pb-2 text-xs text-slate-600">{classroom.status === 'ATIVA' ? `${classroom.activityCount} atividade${classroom.activityCount !== 1 ? 's' : ''}` : 'Encerrada'}</p>
                  <Link to={`/dashboard/teacher/classes/${classroom.id}`} className={actionClass} aria-label={`${classroom.status === 'ATIVA' ? 'Abrir turma' : 'Consultar'} ${classroom.name}`}>{classroom.status === 'ATIVA' ? 'Abrir turma' : 'Consultar'}</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(240px,1fr)]">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="recent-submissions-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 id="recent-submissions-heading" className="font-display text-sm font-bold text-brand-900">Entregas recentes</h3>
            <span className="shrink-0 text-xs text-slate-600">Últimas 24h</span>
          </div>
          {isPending ? <Skeleton className="h-32 w-full" /> : data?.recentSubmissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">Nenhuma entrega nas últimas 24 horas.</p>
          ) : data ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] table-fixed text-left text-xs">
                <caption className="sr-only">Últimas entregas das suas turmas nas últimas 24 horas</caption>
                <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-brand-600">
                  <tr>{['Aluno', 'Atividade', 'Turma', 'Status'].map((heading) => <th key={heading} scope="col" className="px-2 py-2 font-semibold">{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentSubmissions.map((submission) => {
                    const status = submissionStyles[submission.status];
                    return (
                      <tr key={`${submission.kind}-${submission.id}`}>
                        <td className="break-words px-2 py-3 text-slate-700">{submission.studentName}</td>
                        <td className="break-words px-2 py-3"><Link className="font-medium text-brand-900 underline-offset-2 hover:underline focus-visible:underline" to={`/dashboard/teacher/activities/${submission.kind === 'CODE' ? 'code/' : ''}${submission.activityId}/submissions`}>{submission.activityTitle}</Link></td>
                        <td className="break-words px-2 py-3 text-slate-700">{submission.className}</td>
                        <td className="px-2 py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${status.className}`}>{status.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="teacher-shortcuts-heading">
          <h3 id="teacher-shortcuts-heading" className="mb-3 font-display text-sm font-bold text-brand-900">Atalhos</h3>
          <div className="space-y-2">
            <Link to="/dashboard/teacher/activities/new" className={cn(primaryActionClass, 'w-full justify-start')}><Plus className="h-3.5 w-3.5" aria-hidden="true" /> Criar atividade</Link>
            <Link to="/dashboard/teacher/classes" className={cn(actionClass, 'w-full justify-start')}><ListChecks className="h-3.5 w-3.5" aria-hidden="true" /> Gerenciar turmas</Link>
            <Link to="/dashboard/posts" className={cn(actionClass, 'w-full justify-start')}><MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> Publicar no mural</Link>
          </div>
        </section>
      </div>
    </div>
  );
};
