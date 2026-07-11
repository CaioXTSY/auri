import { useCallback, useEffect, useState } from 'react';
import { Archive, Code2, Edit3, Eye, FileUp, HelpCircle, Loader2, Plus, Send, Type } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { activityService, type Activity, type ActivityType } from '@/services/activity-service';
import { programmingService, type ProgrammingAssignment } from '@/services/programming-service';

const typeInfo: Record<ActivityType, { label: string; icon: typeof Type }> = {
  TEXT: { label: 'Resposta escrita', icon: Type },
  FILE: { label: 'Arquivo', icon: FileUp },
  QUIZ: { label: 'Questionário', icon: HelpCircle },
  CODE: { label: 'Código', icon: Code2 },
};
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString('pt-BR') : 'Sem prazo';

export const TeacherActivities = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [codeAssignments, setCodeAssignments] = useState<ProgrammingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [general, code] = await Promise.all([
        activityService.listTeacher(classId),
        programmingService.getAssignments(1, 100),
      ]);
      setActivities(general.data);
      setCodeAssignments(classId ? code.data.filter((item) => item.classId === classId || item.class?.id === classId) : code.data);
    } catch {
      setError('Não foi possível carregar as atividades.');
    } finally {
      setIsLoading(false);
    }
  }, [classId]);
  useEffect(() => { void load(); }, [load]);

  const publish = async (id: string) => {
    try { await activityService.publish(id); await load(); } catch { setError('Não foi possível publicar a atividade.'); }
  };
  const archive = async (id: string) => {
    try { await activityService.archive(id); await load(); } catch { setError('Não foi possível arquivar a atividade.'); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><h1 className="font-display text-2xl font-bold text-brand-900">Atividades</h1><p className="text-sm text-slate-500">Crie entregas de texto, arquivo, questionários e exercícios de código.</p></div>
          <Button onClick={() => navigate(`/dashboard/teacher/activities/new${classId ? `?classId=${classId}` : ''}`)}><Plus className="mr-2 h-4 w-4" />Nova atividade</Button>
        </div>
        {error ? <ErrorState message={error} action={<Button size="sm" variant="outline" onClick={load}>Tentar novamente</Button>} /> : null}
        {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div> : null}
        {!isLoading && activities.length === 0 && codeAssignments.length === 0 ? <EmptyState message="Nenhuma atividade criada." action={<Button onClick={() => navigate('/dashboard/teacher/activities/new')}>Criar primeira atividade</Button>} /> : null}

        {activities.length ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {activities.map((activity) => {
              const info = typeInfo[activity.type]; const Icon = info.icon;
              return <article key={activity.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className="rounded-lg bg-brand-50 p-2 text-brand-700"><Icon className="h-5 w-5" /></div><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{info.label} · {activity.class?.name}</p><h2 className="mt-1 truncate font-semibold text-brand-900">{activity.title}</h2></div></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${activity.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : activity.status === 'DRAFT' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{activity.status === 'PUBLISHED' ? 'Publicada' : activity.status === 'DRAFT' ? 'Rascunho' : 'Arquivada'}</span></div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">{activity.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500"><span>{formatDate(activity.dueDate)}</span><span>{activity.maxScore} pontos</span><span>{activity._count?.submissions ?? 0} entregas</span></div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4"><Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/teacher/activities/${activity.id}/edit`)}><Edit3 className="mr-1 h-3.5 w-3.5" />Editar</Button><Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/teacher/activities/${activity.id}/submissions`)}><Eye className="mr-1 h-3.5 w-3.5" />Entregas</Button>{activity.status === 'DRAFT' ? <Button size="sm" onClick={() => publish(activity.id)}><Send className="mr-1 h-3.5 w-3.5" />Publicar</Button> : null}{activity.status === 'PUBLISHED' ? <Button size="sm" variant="ghost" onClick={() => archive(activity.id)}><Archive className="mr-1 h-3.5 w-3.5" />Arquivar</Button> : null}</div>
              </article>;
            })}
          </section>
        ) : null}

        {codeAssignments.length ? <section className="space-y-3"><div><h2 className="font-semibold text-brand-900">Atividades de código existentes</h2><p className="text-xs text-slate-500">Mantidas no judge atual.</p></div><div className="grid gap-3 lg:grid-cols-2">{codeAssignments.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><div className="flex min-w-0 items-center gap-3"><Code2 className="h-5 w-5 shrink-0 text-brand-700" /><div className="min-w-0"><p className="truncate font-semibold text-brand-900">{item.title}</p><p className="text-xs text-slate-500">{item.class?.name} · {formatDate(item.dueDate)}</p></div></div><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/teacher/activities/code/${item.id}/edit`)}>Editar</Button><Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/teacher/activities/code/${item.id}/submissions`)}>Envios</Button></div></article>)}</div></section> : null}
      </div>
    </DashboardLayout>
  );
};
