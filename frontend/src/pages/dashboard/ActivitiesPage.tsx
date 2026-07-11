import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Code2, FileUp, HelpCircle, Loader2, Type } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { activityService, type Activity, type ActivityType } from '@/services/activity-service';
import { programmingService, type ProgrammingAssignment } from '@/services/programming-service';

const typeInfo: Record<ActivityType, { label: string; icon: typeof Type }> = {
  TEXT: { label: 'Resposta escrita', icon: Type }, FILE: { label: 'Arquivo', icon: FileUp }, QUIZ: { label: 'Questionário', icon: HelpCircle }, CODE: { label: 'Código', icon: Code2 },
};
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString('pt-BR') : 'Sem prazo';

export const ActivitiesPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const classId = params.get('classId') ?? undefined;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [codeActivities, setCodeActivities] = useState<ProgrammingAssignment[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const [general, code] = await Promise.all([activityService.listMine(classId), programmingService.getMyAssignments()]);
      setActivities(general.data);
      setCodeActivities(classId ? code.filter((item) => item.classId === classId || item.class?.id === classId) : code);
    } catch { setError('Não foi possível carregar as atividades.'); }
    finally { setIsLoading(false); }
  }, [classId]);
  useEffect(() => { void load(); }, [load]);

  const filtered = activities.filter((activity) => {
    if (filter === 'ALL') return true;
    const status = activity.submissions?.[0]?.status;
    if (filter === 'PENDING') return !status || status === 'DRAFT' || status === 'RETURNED';
    if (filter === 'SUBMITTED') return status === 'SUBMITTED' || status === 'LATE' || status === 'UNDER_REVIEW';
    return status === 'GRADED';
  });

  return <DashboardLayout><div className="space-y-6">
    <div><h1 className="font-display text-2xl font-bold text-brand-900">Atividades</h1><p className="text-sm text-slate-500">Acompanhe prazos, entregas e correções das suas turmas.</p></div>
    <div className="flex flex-wrap gap-2">{(['ALL', 'PENDING', 'SUBMITTED', 'GRADED'] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filter === item ? 'bg-brand-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item === 'ALL' ? 'Todas' : item === 'PENDING' ? 'Pendentes' : item === 'SUBMITTED' ? 'Entregues' : 'Corrigidas'}</button>)}</div>
    {error ? <ErrorState message={error} action={<Button size="sm" variant="outline" onClick={load}>Tentar novamente</Button>} /> : null}
    {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div> : null}
    {!isLoading && filtered.length === 0 && (filter !== 'ALL' || codeActivities.length === 0) ? <EmptyState message="Nenhuma atividade encontrada neste filtro." /> : null}
    <div className="grid gap-4 lg:grid-cols-2">{filtered.map((activity) => { const info = typeInfo[activity.type]; const Icon = info.icon; const submission = activity.submissions?.[0]; const late = Boolean(activity.dueDate && new Date(activity.dueDate) < new Date() && !submission); return <article key={activity.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className="rounded-lg bg-brand-50 p-2 text-brand-700"><Icon className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{activity.class?.name} · {info.label}</p><h2 className="mt-1 font-semibold text-brand-900">{activity.title}</h2></div></div>{submission ? <span className={`rounded-full px-2 py-1 text-xs font-semibold ${submission.status === 'GRADED' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{submission.status === 'GRADED' ? 'Corrigida' : submission.status === 'DRAFT' ? 'Rascunho' : 'Entregue'}</span> : late ? <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Atrasada</span> : null}</div><p className="mt-3 line-clamp-2 text-sm text-slate-600">{activity.description}</p><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatDate(activity.dueDate)}</span><span>{activity.maxScore} pontos · {activity.xpReward} XP</span></div><Button className="mt-4 w-full" onClick={() => navigate(`/dashboard/activities/${activity.id}`)}>{submission?.status === 'GRADED' ? <><CheckCircle2 className="mr-2 h-4 w-4" />Ver correção</> : 'Abrir atividade'}</Button></article>; })}</div>
    {filter === 'ALL' && codeActivities.length ? <section className="space-y-3"><h2 className="font-semibold text-brand-900">Atividades de código</h2><div className="grid gap-3 lg:grid-cols-2">{codeActivities.map((item) => <article key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3"><Code2 className="h-5 w-5 text-brand-700" /><div><p className="font-semibold text-brand-900">{item.title}</p><p className="text-xs text-slate-500">{item.class?.name} · {formatDate(item.dueDate)}</p></div></div><Button size="sm" onClick={() => navigate(`/dashboard/activities/code/${item.id}`)}>Resolver</Button></article>)}</div></section> : null}
  </div></DashboardLayout>;
};
