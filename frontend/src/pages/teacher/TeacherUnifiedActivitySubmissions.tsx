import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { activityService, type Activity, type ActivitySubmission, type SubmissionStatus } from '@/services/activity-service';
import { classService, type StudentInClass } from '@/services/class-service';

const submissionStatusLabels: Record<SubmissionStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviada',
  LATE: 'Enviada com atraso',
  UNDER_REVIEW: 'Em correção',
  GRADED: 'Corrigida',
  RETURNED: 'Devolvida',
};

export const TeacherUnifiedActivitySubmissions = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [students, setStudents] = useState<StudentInClass[]>([]);
  const [selected, setSelected] = useState<ActivitySubmission | null>(null);
  const [status, setStatus] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true); setError(null);
    try {
      const activityData = await activityService.get(id);
      const [submissionData, studentData] = await Promise.all([
        activityService.listSubmissions(id),
        classService.getStudents(activityData.classId),
      ]);
      setActivity(activityData); setSubmissions(submissionData); setStudents(studentData.filter((item) => item.user.role === 'ALUNO'));
    }
    catch { setError('Não foi possível carregar as entregas.'); }
    finally { setIsLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  const latestByStudent = useMemo(() => {
    const items = new Map<string, ActivitySubmission>();
    for (const submission of submissions) {
      if (!items.has(submission.userId)) items.set(submission.userId, submission);
    }
    return Array.from(items.values());
  }, [submissions]);
  const filtered = useMemo(() => status === 'ALL' ? latestByStudent : latestByStudent.filter((item) => item.status === status), [status, latestByStudent]);
  const open = (submission: ActivitySubmission) => { setSelected(submission); setScore(submission.score ?? 0); setFeedback(submission.feedback ?? ''); };
  const grade = async () => { if (!activity || !selected) return; setIsSaving(true); try { await activityService.grade(activity.id, selected.id, score, feedback); setSelected(null); await load(); } catch { setError('Não foi possível salvar a correção.'); } finally { setIsSaving(false); } };
  const returnToStudent = async () => { if (!activity || !selected) return; setIsSaving(true); try { await activityService.returnSubmission(activity.id, selected.id, feedback); setSelected(null); await load(); } catch { setError('Não foi possível devolver a atividade.'); } finally { setIsSaving(false); } };

  const counts = { delivered: latestByStudent.filter((item) => item.status !== 'DRAFT').length, late: latestByStudent.filter((item) => item.status === 'LATE').length, graded: latestByStudent.filter((item) => item.status === 'GRADED').length, pending: Math.max(0, students.filter((student) => student.membershipType !== 'OWNER' && student.user.role === 'ALUNO').length - latestByStudent.filter((item) => item.status !== 'DRAFT').length) };
  return <DashboardLayout><div className="space-y-6">
    <div className="flex items-start justify-between gap-4"><div><Button variant="ghost" className="mb-2 px-0" onClick={() => navigate('/dashboard/teacher/activities')}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button><h1 className="font-display text-2xl font-bold text-brand-900">Entregas</h1><p className="text-sm text-slate-500">{activity?.title ?? 'Atividade'}</p></div><Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button></div>
    {error ? <ErrorState message={error} /> : null}
    {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div> : null}
    {!isLoading ? <><section className="grid gap-3 sm:grid-cols-4">{[['Entregues', counts.delivered], ['Pendentes', counts.pending], ['Atrasadas', counts.late], ['Corrigidas', counts.graded]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-brand-900">{value}</p></div>)}</section>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]"><section className="rounded-xl border border-slate-200 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-brand-900">Alunos</h2><select value={status} onChange={(event) => setStatus(event.target.value as SubmissionStatus | 'ALL')} className="h-9 rounded-md border border-slate-200 px-2 text-sm"><option value="ALL">Todos</option><option value="SUBMITTED">Entregues</option><option value="LATE">Atrasadas</option><option value="GRADED">Corrigidas</option><option value="RETURNED">Devolvidas</option></select></div>{filtered.length === 0 ? <EmptyState message="Nenhuma entrega neste filtro." className="py-10" /> : <div className="divide-y divide-slate-100">{filtered.map((item) => <button key={item.id} type="button" onClick={() => open(item)} className={`flex w-full items-center justify-between gap-3 py-3 text-left ${selected?.id === item.id ? 'text-brand-800' : ''}`}><div><p className="font-semibold">{item.user?.name ?? 'Aluno'}</p><p className="text-xs text-slate-500">Tentativa {item.attemptNumber} · {item.submittedAt ? new Date(item.submittedAt).toLocaleString('pt-BR') : 'rascunho'}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{submissionStatusLabels[item.status]}</span></button>)}</div>}</section>
    <section className="rounded-xl border border-slate-200 bg-white p-5">{!selected ? <EmptyState message="Selecione uma entrega para corrigir." className="py-12" /> : <div className="space-y-5"><div><h2 className="font-semibold text-brand-900">{selected.user?.name}</h2><p className="text-xs text-slate-500">{selected.user?.email}</p></div>{selected.textAnswer ? <div className="rounded-lg bg-slate-50 p-4 text-sm"><MarkdownContent content={selected.textAnswer} /></div> : null}{selected.answers.length ? <div className="space-y-3">{selected.answers.map((answer, index) => <div key={answer.id} className="rounded-lg border border-slate-200 p-3"><p className="text-sm font-semibold">{index + 1}. {answer.question?.prompt}</p><p className="mt-2 text-sm text-slate-600">{answer.selectedOption?.text ?? answer.textAnswer ?? 'Sem resposta'}</p>{answer.score != null ? <p className="mt-1 text-xs text-slate-500">Correção automática: {answer.score} ponto(s)</p> : null}</div>)}</div> : null}{selected.attachments.length ? <div className="flex flex-wrap gap-2">{selected.attachments.map((file) => <Button key={file.id} size="sm" variant="outline" onClick={() => activityService.downloadAttachment(file.id, file.originalName)}><Download className="mr-2 h-4 w-4" />{file.originalName}</Button>)}</div> : null}<div className="grid gap-4 sm:grid-cols-2"><Field htmlFor="score" label={`Nota (máx. ${activity?.maxScore ?? 0})`}><Input id="score" type="number" min={0} max={activity?.maxScore} value={score} onChange={(event) => setScore(Number(event.target.value))} /></Field><Field htmlFor="feedback" label="Feedback"><textarea id="feedback" rows={4} value={feedback} onChange={(event) => setFeedback(event.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></Field></div><div className="flex gap-2"><Button variant="outline" onClick={returnToStudent} disabled={isSaving}>Solicitar nova entrega</Button><Button onClick={grade} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Corrigir e devolver</Button></div></div>}</section></div></> : null}
  </div></DashboardLayout>;
};
