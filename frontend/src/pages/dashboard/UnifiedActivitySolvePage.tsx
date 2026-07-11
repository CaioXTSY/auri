import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, FileUp, Loader2, Save, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { activityService, type Activity, type ActivitySubmission } from '@/services/activity-service';

export const UnifiedActivitySolvePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId?: string; textAnswer?: string }>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true); setError(null);
    try {
      const [activityData, submissionData] = await Promise.all([activityService.get(id), activityService.mySubmissions(id)]);
      setActivity(activityData); setSubmissions(submissionData);
      const editable = submissionData.find((item) => item.status === 'DRAFT') ?? submissionData[0];
      if (editable?.status === 'DRAFT') {
        setTextAnswer(editable.textAnswer ?? '');
        setAnswers(Object.fromEntries(editable.answers.map((answer) => [answer.questionId, { selectedOptionId: answer.selectedOptionId ?? undefined, textAnswer: answer.textAnswer ?? undefined }])));
      }
    } catch { setError('Não foi possível abrir a atividade.'); }
    finally { setIsLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const latest = submissions[0];
  const isFinal = latest && latest.status !== 'DRAFT' && latest.status !== 'RETURNED';
  const payload = useMemo(() => ({ textAnswer, answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, ...answer })) }), [answers, textAnswer]);

  const saveDraft = async () => {
    if (!activity) return;
    setIsSaving(true); setError(null);
    try { await activityService.saveDraft(activity.id, payload); await load(); }
    catch { setError('Não foi possível salvar o rascunho.'); }
    finally { setIsSaving(false); }
  };
  const submit = async () => {
    if (!activity || !window.confirm('Confirmar a entrega desta atividade?')) return;
    setIsSaving(true); setError(null);
    try {
      if (activity.type === 'FILE') {
        const draft = await activityService.saveDraft(activity.id, payload);
        if (files.length) await activityService.uploadAttachments(activity.id, draft.id, files);
      }
      await activityService.submit(activity.id, payload);
      setFiles([]); await load();
    } catch { setError('Não foi possível entregar. Verifique as respostas, anexos e o prazo.'); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div></DashboardLayout>;
  if (!activity || error && !submissions.length) return <DashboardLayout><ErrorState message={error ?? 'Atividade não encontrada.'} /></DashboardLayout>;

  return <DashboardLayout><div className="mx-auto max-w-4xl space-y-6">
    <Button variant="ghost" className="px-0" onClick={() => navigate('/dashboard/activities')}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
    <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{activity.class?.name} · {activity.type}</p><h1 className="mt-2 font-display text-2xl font-bold text-brand-900">{activity.title}</h1><div className="mt-4 text-sm text-slate-700"><MarkdownContent content={activity.description} /></div><div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500"><span>Nota: {activity.maxScore}</span><span>XP: {activity.xpReward}</span><span>Prazo: {activity.dueDate ? new Date(activity.dueDate).toLocaleString('pt-BR') : 'sem prazo'}</span><span>Tentativas: {activity.maxAttempts}</span></div></header>
    {error ? <ErrorState message={error} /> : null}
    {activity.materials?.length ? <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-brand-900">Materiais</h2><div className="mt-3 flex flex-wrap gap-2">{activity.materials.map((file) => <Button key={file.id} variant="outline" size="sm" onClick={() => activityService.downloadMaterial(file.id, file.originalName)}><Download className="mr-2 h-4 w-4" />{file.originalName}</Button>)}</div></section> : null}

    {isFinal ? <SubmissionResult submission={latest} activity={activity} /> : <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {activity.type === 'TEXT' ? <Field htmlFor="textAnswer" label="Sua resposta"><textarea id="textAnswer" rows={12} value={textAnswer} onChange={(event) => setTextAnswer(event.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></Field> : null}
      {activity.type === 'FILE' ? <Field htmlFor="files" label="Arquivos da entrega" description={`Até ${activity.maxFiles} arquivos, ${(activity.maxFileSize / 1024 / 1024).toFixed(0)} MB cada.`}><input id="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} className="block w-full rounded-lg border border-dashed border-slate-300 p-6 text-sm" /></Field> : null}
      {activity.type === 'QUIZ' ? <div className="space-y-5">{activity.questions?.map((question, index) => <fieldset key={question.id} className="rounded-lg border border-slate-200 p-4"><legend className="px-1 font-semibold text-brand-900">{index + 1}. {question.prompt} <span className="text-xs font-normal text-slate-500">({question.points} pontos)</span></legend>{question.type === 'SHORT_ANSWER' ? <textarea aria-label={`Resposta da questão ${index + 1}`} rows={4} value={answers[question.id]?.textAnswer ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: { textAnswer: event.target.value } }))} className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /> : <div className="mt-3 space-y-2">{question.options.map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"><input type="radio" name={`question-${question.id}`} checked={answers[question.id]?.selectedOptionId === option.id} onChange={() => setAnswers((current) => ({ ...current, [question.id]: { selectedOptionId: option.id } }))} />{option.text}</label>)}</div>}</fieldset>)}</div> : null}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={saveDraft} disabled={isSaving}><Save className="mr-2 h-4 w-4" />Salvar rascunho</Button><Button type="button" onClick={submit} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Entregar</Button></div>
    </section>}
    {submissions.length > 1 ? <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-brand-900">Histórico de tentativas</h2><div className="mt-3 divide-y divide-slate-100">{submissions.map((item) => <div key={item.id} className="flex justify-between py-3 text-sm"><span>Tentativa {item.attemptNumber} · {item.status}</span><span>{item.score == null ? 'Sem nota' : `${item.score}/${activity.maxScore}`}</span></div>)}</div></section> : null}
  </div></DashboardLayout>;
};

const SubmissionResult = ({ submission, activity }: { submission: ActivitySubmission; activity: Activity }) => <section className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-emerald-600" /><div><h2 className="font-semibold text-brand-900">{submission.status === 'GRADED' ? 'Atividade corrigida' : 'Entrega registrada'}</h2><p className="text-sm text-slate-500">Tentativa {submission.attemptNumber} · {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('pt-BR') : submission.status}</p></div></div>{submission.status === 'GRADED' ? <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Nota</p><p className="text-2xl font-bold text-brand-900">{submission.score}/{activity.maxScore}</p></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">XP recebido</p><p className="text-2xl font-bold text-amber-600">+{submission.xpAwarded}</p></div><div className="rounded-lg bg-slate-50 p-4 sm:col-span-1"><p className="text-xs text-slate-500">Feedback</p><p className="mt-1 text-sm text-slate-700">{submission.feedback || 'Sem comentário.'}</p></div></div> : <p className="mt-4 text-sm text-slate-600">Aguarde a correção do professor.</p>}{submission.attachments.length ? <div className="mt-4 flex flex-wrap gap-2">{submission.attachments.map((file) => <Button key={file.id} variant="outline" size="sm" onClick={() => activityService.downloadAttachment(file.id, file.originalName)}><FileUp className="mr-2 h-4 w-4" />{file.originalName}</Button>)}</div> : null}</section>;
